import { AIValidator } from './openai.js';
import { ReportDatabase } from './firestore.js';

/**
 * Report Validator Service
 * Main service that orchestrates report validation with AI and manages rejection logic
 */
export class ReportValidator {
    constructor(aiValidator = new AIValidator(), database = new ReportDatabase()) {
        this.aiValidator = aiValidator;
        this.database = database;
        this.maxAttempts = 3;
        this.passThreshold = 70; // Score threshold for acceptance
    }

    /**
     * Validates a report and manages the rejection/acceptance flow
     * @param {Object} report - The report to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateReport(report) {
        try {
            // Validate input
            this.validateReportInput(report);

            // Get current report state from database
            const existingReport = await this.database.getReport(report.id);

            // Determine attempt number
            const attemptNumber = existingReport
                ? (existingReport.attempts || 0) + 1
                : 1;

            // Check if we've exceeded max attempts
            if (attemptNumber > this.maxAttempts) {
                return await this.handleMaxAttemptsExceeded(report);
            }

            // Perform AI validation
            const validationResult = await this.aiValidator.validateReport(report, attemptNumber);

            // Add validation attempt to history
            await this.database.addValidationAttempt(report.id, {
                ...validationResult,
                attemptNumber,
                reportData: report
            });

            // Determine action based on score
            if (validationResult.score >= this.passThreshold) {
                return await this.handleAcceptance(report, validationResult, attemptNumber);
            } else {
                return await this.handleRejection(report, validationResult, attemptNumber);
            }

        } catch (error) {
            console.error('Report validation error:', error);
            return this.createErrorResult('VALIDATION_ERROR', error.message);
        }
    }

    /**
     * Validates that the report has all required fields
     */
    validateReportInput(report) {
        if (!report || typeof report !== 'object') {
            throw new Error('Report must be a valid object');
        }

        if (!report.id || typeof report.id !== 'string') {
            throw new Error('Report must have a valid ID');
        }

        if (!report.incidentType || typeof report.incidentType !== 'string') {
            throw new Error('Report must have an incident type');
        }

        if (!report.description || typeof report.description !== 'string') {
            throw new Error('Report must have a description');
        }

        // Validate location
        if (!report.location || typeof report.location !== 'object') {
            throw new Error('Report must have a valid location');
        }

        if (typeof report.location.lat !== 'number' || typeof report.location.lng !== 'number') {
            throw new Error('Location must have valid latitude and longitude');
        }

        // Validate Addis Ababa bounds (rough approximation)
        if (report.location.lat < 8.9 || report.location.lat > 9.1 ||
            report.location.lng < 38.7 || report.location.lng > 38.9) {
            throw new Error('Location must be within Addis Ababa area');
        }

        // Validate timestamp
        if (!report.timestamp || isNaN(new Date(report.timestamp).getTime())) {
            throw new Error('Report must have a valid timestamp');
        }

        // Check if timestamp is not in the future
        const reportTime = new Date(report.timestamp).getTime();
        const now = Date.now();
        if (reportTime > now + (24 * 60 * 60 * 1000)) { // Allow 1 day in future for timezone issues
            throw new Error('Report timestamp cannot be too far in the future');
        }
    }

    /**
     * Handles report acceptance
     */
    async handleAcceptance(report, validationResult, attemptNumber) {
        try {
            // Save accepted report
            await this.database.saveReport(report.id, {
                ...report,
                status: 'accepted',
                attempts: attemptNumber,
                finalScore: validationResult.score,
                acceptedAt: new Date(),
                validationResult
            });

            return {
                success: true,
                action: 'accepted',
                score: validationResult.score,
                attempts: attemptNumber,
                message: 'Report accepted successfully',
                reason: validationResult.reason
            };
        } catch (error) {
            console.error('Error handling acceptance:', error);
            throw new Error(`Failed to accept report: ${error.message}`);
        }
    }

    /**
     * Handles report rejection
     */
    async handleRejection(report, validationResult, attemptNumber) {
        try {
            const isFinalAttempt = attemptNumber >= this.maxAttempts;

            // Save rejected report
            await this.database.saveReport(report.id, {
                ...report,
                status: isFinalAttempt ? 'forwarded_to_admin' : 'rejected',
                attempts: attemptNumber,
                lastScore: validationResult.score,
                lastRejectionReason: validationResult.reason,
                rejectedAt: new Date(),
                canRetry: !isFinalAttempt,
                validationResult
            });

            // If this is the final attempt, forward to admin
            if (isFinalAttempt) {
                await this.database.forwardToAdminReview(report.id);
            }

            return {
                success: false,
                action: isFinalAttempt ? 'forwarded_to_admin' : 'rejected',
                score: validationResult.score,
                attempts: attemptNumber,
                maxAttempts: this.maxAttempts,
                message: isFinalAttempt
                    ? 'Report forwarded to admin for manual review after maximum attempts reached'
                    : `Report rejected. ${this.maxAttempts - attemptNumber} attempts remaining.`,
                reason: validationResult.reason,
                suggestions: validationResult.suggestions || [],
                canRetry: !isFinalAttempt
            };
        } catch (error) {
            console.error('Error handling rejection:', error);
            throw new Error(`Failed to reject report: ${error.message}`);
        }
    }

    /**
     * Handles when maximum attempts are exceeded
     */
    async handleMaxAttemptsExceeded(report) {
        try {
            // Forward to admin review
            await this.database.forwardToAdminReview(report.id);

            return {
                success: false,
                action: 'forwarded_to_admin',
                attempts: this.maxAttempts,
                maxAttempts: this.maxAttempts,
                message: 'Maximum validation attempts exceeded. Report forwarded to admin for manual review.',
                canRetry: false
            };
        } catch (error) {
            console.error('Error forwarding to admin:', error);
            throw new Error(`Failed to forward report: ${error.message}`);
        }
    }

    /**
     * Creates an error result object
     */
    createErrorResult(type, message) {
        return {
            success: false,
            action: 'error',
            error: {
                type,
                message
            },
            canRetry: true
        };
    }

    /**
     * Gets validation statistics
     */
    async getValidationStats() {
        return await this.database.getValidationStats();
    }

    /**
     * Gets report validation history
     */
    async getReportHistory(reportId) {
        return await this.database.getValidationHistory(reportId);
    }

    /**
     * Health check for the validation service
     */
    async healthCheck() {
        try {
            const aiHealth = await this.aiValidator.healthCheck();
            const dbStats = await this.database.getValidationStats();

            return {
                status: aiHealth.status === 'healthy' ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                services: {
                    ai: aiHealth,
                    database: {
                        status: 'healthy',
                        stats: dbStats
                    }
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Configures the validator settings
     */
    configure(options = {}) {
        if (options.maxAttempts && options.maxAttempts > 0) {
            this.maxAttempts = options.maxAttempts;
        }
        if (options.passThreshold && options.passThreshold >= 0 && options.passThreshold <= 100) {
            this.passThreshold = options.passThreshold;
        }
        if (options.aiValidator) {
            this.aiValidator = options.aiValidator;
        }
        if (options.database) {
            this.database = options.database;
        }
    }
}

export const reportValidator = new ReportValidator();