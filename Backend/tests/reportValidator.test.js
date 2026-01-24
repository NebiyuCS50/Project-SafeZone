import { ReportValidator } from '../services/reportValidator.js';
import { AIValidator } from '../services/openai.js';
import { ReportDatabase } from '../services/firestore.js';

// Mock dependencies
jest.mock('../services/openai');
jest.mock('../services/firestore');

describe('ReportValidator', () => {
    let validator;
    let mockAIValidator;
    let mockDatabase;

    const validReport = {
        id: 'test-report-123',
        incidentType: 'accident',
        description: 'Car accident on Bole Road',
        location: { lat: 9.01, lng: 38.76 },
        timestamp: Date.now(),
        userId: 'user-123'
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock instances
        mockAIValidator = {
            validateReport: jest.fn()
        };

        mockDatabase = {
            getReport: jest.fn(),
            saveReport: jest.fn(),
            addValidationAttempt: jest.fn(),
            forwardToAdminReview: jest.fn()
        };

        // Create validator with mocked dependencies
        validator = new ReportValidator(mockAIValidator, mockDatabase);
    });

    describe('validateReport', () => {
        test('should accept a valid report with high AI score', async () => {
            // Setup
            mockDatabase.getReport.mockResolvedValue(null); // First attempt
            mockAIValidator.validateReport.mockResolvedValue({
                score: 85,
                reason: 'Report is valid and well-documented',
                confidence: 0.9,
                suggestions: []
            });
            mockDatabase.addValidationAttempt.mockResolvedValue({});
            mockDatabase.saveReport.mockResolvedValue('test-report-123');

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.success).toBe(true);
            expect(result.action).toBe('accepted');
            expect(result.score).toBe(85);
            expect(result.attempts).toBe(1);
            expect(mockDatabase.saveReport).toHaveBeenCalledWith(
                'test-report-123',
                expect.objectContaining({
                    status: 'accepted',
                    attempts: 1,
                    finalScore: 85
                })
            );
        });

        test('should reject a report with low AI score on first attempt', async () => {
            // Setup
            mockDatabase.getReport.mockResolvedValue(null);
            mockAIValidator.validateReport.mockResolvedValue({
                score: 45,
                reason: 'Description is too vague',
                confidence: 0.8,
                suggestions: ['Add more details about the incident']
            });
            mockDatabase.addValidationAttempt.mockResolvedValue({});
            mockDatabase.saveReport.mockResolvedValue('test-report-123');

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.success).toBe(false);
            expect(result.action).toBe('rejected');
            expect(result.score).toBe(45);
            expect(result.attempts).toBe(1);
            expect(result.canRetry).toBe(true);
            expect(result.suggestions).toContain('Add more details about the incident');
        });

        test('should forward to admin after 3 failed attempts', async () => {
            // Setup - Third attempt
            mockDatabase.getReport.mockResolvedValue({
                attempts: 2,
                status: 'rejected'
            });
            mockAIValidator.validateReport.mockResolvedValue({
                score: 50,
                reason: 'Still insufficient detail',
                confidence: 0.7,
                suggestions: ['Please provide more specific information']
            });
            mockDatabase.addValidationAttempt.mockResolvedValue({});
            mockDatabase.saveReport.mockResolvedValue('test-report-123');
            mockDatabase.forwardToAdminReview.mockResolvedValue('test-report-123');

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.success).toBe(false);
            expect(result.action).toBe('forwarded_to_admin');
            expect(result.attempts).toBe(3);
            expect(result.canRetry).toBe(false);
            expect(mockDatabase.forwardToAdminReview).toHaveBeenCalledWith('test-report-123');
        });

        test('should handle existing report with previous attempts', async () => {
            // Setup - Second attempt
            mockDatabase.getReport.mockResolvedValue({
                attempts: 1,
                status: 'rejected'
            });
            mockAIValidator.validateReport.mockResolvedValue({
                score: 75,
                reason: 'Improved but still needs work',
                confidence: 0.8,
                suggestions: []
            });
            mockDatabase.addValidationAttempt.mockResolvedValue({});
            mockDatabase.saveReport.mockResolvedValue('test-report-123');

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.attempts).toBe(2);
            expect(mockAIValidator.validateReport).toHaveBeenCalledWith(validReport, 2);
        });
    });

    describe('validateReportInput', () => {
        test('should accept valid report input', () => {
            expect(() => validator.validateReportInput(validReport)).not.toThrow();
        });

        test('should reject report without ID', () => {
            const invalidReport = { ...validReport };
            delete invalidReport.id;

            expect(() => validator.validateReportInput(invalidReport))
                .toThrow('Report must have a valid ID');
        });

        test('should reject report without incident type', () => {
            const invalidReport = { ...validReport };
            delete invalidReport.incidentType;

            expect(() => validator.validateReportInput(invalidReport))
                .toThrow('Report must have an incident type');
        });

        test('should reject report with invalid location', () => {
            const invalidReport = {
                ...validReport,
                location: { lat: 0, lng: 0 } // Outside Addis Ababa
            };

            expect(() => validator.validateReportInput(invalidReport))
                .toThrow('Location must be within Addis Ababa area');
        });

        test('should reject report with future timestamp', () => {
            const invalidReport = {
                ...validReport,
                timestamp: Date.now() + (48 * 60 * 60 * 1000) // 2 days in future
            };

            expect(() => validator.validateReportInput(invalidReport))
                .toThrow('Report timestamp cannot be too far in the future');
        });
    });

    describe('error handling', () => {
        test('should handle AI validation errors gracefully', async () => {
            // Setup
            mockDatabase.getReport.mockResolvedValue(null);
            mockAIValidator.validateReport.mockRejectedValue(new Error('AI service unavailable'));

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.success).toBe(false);
            expect(result.action).toBe('error');
            expect(result.error.type).toBe('VALIDATION_ERROR');
        });

        test('should handle database errors', async () => {
            // Setup
            mockDatabase.getReport.mockRejectedValue(new Error('Database connection failed'));

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.success).toBe(false);
            expect(result.action).toBe('error');
            expect(result.error.message).toContain('Database connection failed');
        });
    });

    describe('configuration', () => {
        test('should allow configuration of validation settings', () => {
            validator.configure({
                maxAttempts: 5,
                passThreshold: 80
            });

            expect(validator.maxAttempts).toBe(5);
            expect(validator.passThreshold).toBe(80);
        });

        test('should reject invalid configuration', () => {
            // Should not change with invalid values
            validator.configure({
                maxAttempts: -1,
                passThreshold: 150
            });

            expect(validator.maxAttempts).toBe(3); // Default
            expect(validator.passThreshold).toBe(70); // Default
        });
    });
});