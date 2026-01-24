import { AIValidator } from './openai.js';
import { ReportDatabase } from './firestore.js';
import { cloudinaryService } from './cloudinary.js';

/**
 * Report Validator Service
 * Main service that orchestrates report validation with AI and stores scores for admin review
 */
export class ReportValidator {
    constructor(aiValidator = new AIValidator(), database = new ReportDatabase(), cloudinary = cloudinaryService) {
        this.aiValidator = aiValidator;
        this.database = database;
        this.cloudinary = cloudinary;
    }

    /**
     * Validates a report and stores the quality score for admin review
     * @param {Object} report - The report to validate
     * @returns {Promise<Object>} Validation result with score
     */
    async validateReport(report) {
        try {
            // Validate input
            this.validateReportInput(report);

            // Analyze image with Cloudinary if available
            let cloudinaryAnalysis = null;
            if (report.imageUrl && this.cloudinary.constructor.isValidCloudinaryUrl(report.imageUrl)) {
                try {
                    const publicId = this.cloudinary.constructor.extractPublicId(report.imageUrl);
                    if (publicId) {
                        cloudinaryAnalysis = await this.cloudinary.analyzeImage(publicId);
                    }
                } catch (cloudinaryError) {
                    console.warn('Cloudinary analysis failed, proceeding without it:', cloudinaryError.message);
                }
            }

            // Perform AI validation to get quality score
            const validationResult = await this.aiValidator.validateReport(report, cloudinaryAnalysis);

            // Store report with validation score and Cloudinary analysis for admin review
            await this.database.saveReport(report.id, {
                ...report,
                status: 'pending_admin_review',
                qualityScore: validationResult.score,
                validationResult,
                validatedAt: new Date(),
                // Store breakdown for admin analysis
                scoreBreakdown: validationResult.breakdown,
                aiConfidence: validationResult.confidence,
                aiReason: validationResult.reason,
                aiRecommendations: validationResult.recommendations,
                // Store Cloudinary analysis if available
                cloudinaryAnalysis: cloudinaryAnalysis ? {
                    quality: cloudinaryAnalysis.quality,
                    contentType: cloudinaryAnalysis.contentType,
                    tags: cloudinaryAnalysis.tags,
                    faces: cloudinaryAnalysis.faces?.length || 0,
                    metadata: cloudinaryAnalysis.metadata
                } : null
            });

            return {
                success: true,
                action: 'submitted_for_review',
                score: validationResult.score,
                breakdown: validationResult.breakdown,
                message: 'Report submitted successfully and is pending admin review',
                reason: validationResult.reason,
                recommendations: validationResult.recommendations,
                confidence: validationResult.confidence,
                cloudinaryAnalysis: cloudinaryAnalysis ? {
                    quality: cloudinaryAnalysis.quality,
                    contentType: cloudinaryAnalysis.contentType,
                    tags: cloudinaryAnalysis.tags.slice(0, 5) // Limit tags for response
                } : null
            };

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

        // Validate image URL (should be from Cloudinary)
        if (!report.imageUrl || typeof report.imageUrl !== 'string') {
            throw new Error('Report must include an image URL');
        }

        // Basic Cloudinary URL validation
        if (!report.imageUrl.includes('cloudinary.com') && !report.imageUrl.includes('res.cloudinary.com')) {
            throw new Error('Image must be hosted on Cloudinary');
        }

        // Basic URL format validation
        try {
            new URL(report.imageUrl);
        } catch {
            throw new Error('Image URL must be a valid URL');
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
     * Health check for the validation service
     */
    async healthCheck() {
        try {
            const [aiHealth, cloudinaryHealth] = await Promise.all([
                this.aiValidator.healthCheck(),
                this.cloudinary.healthCheck().catch(() => ({ status: 'unhealthy', error: 'Cloudinary not configured' }))
            ]);
            const dbStats = await this.database.getValidationStats();

            const overallStatus = (aiHealth.status === 'healthy' && cloudinaryHealth.status === 'healthy')
                ? 'healthy'
                : aiHealth.status === 'healthy'
                    ? 'degraded'
                    : 'unhealthy';

            return {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                services: {
                    ai: aiHealth,
                    cloudinary: cloudinaryHealth,
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
        if (options.aiValidator) {
            this.aiValidator = options.aiValidator;
        }
        if (options.database) {
            this.database = options.database;
        }
        if (options.cloudinary) {
            this.cloudinary = options.cloudinary;
        }
    }
}

export const reportValidator = new ReportValidator();