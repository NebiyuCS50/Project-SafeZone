const { ReportValidator } = require('../services/reportValidator.js');
const { AIValidator } = require('../services/openai.js');
const { ReportDatabase } = require('../services/firestore.js');

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
        userId: 'user-123',
        imageUrl: 'https://res.cloudinary.com/project/image.jpg'
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
        test('should accept and store any valid report for admin review', async () => {
            // Setup
            mockAIValidator.validateReport.mockResolvedValue({
                score: 85,
                reason: 'Report is valid and well-documented',
                confidence: 0.9,
                breakdown: {
                    imageScore: 28,
                    descriptionScore: 35,
                    categoryScore: 22
                },
                recommendations: []
            });
            mockDatabase.saveReport.mockResolvedValue('test-report-123');

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.success).toBe(true);
            expect(result.action).toBe('submitted_for_review');
            expect(result.score).toBe(85);
            expect(result.breakdown).toEqual({
                imageScore: 28,
                descriptionScore: 35,
                categoryScore: 22
            });
            expect(mockDatabase.saveReport).toHaveBeenCalledWith(
                'test-report-123',
                expect.objectContaining({
                    status: 'pending_admin_review',
                    qualityScore: 85,
                    scoreBreakdown: {
                        imageScore: 28,
                        descriptionScore: 35,
                        categoryScore: 22
                    }
                })
            );
        });

        test('should store low-quality reports for admin review', async () => {
            // Setup
            mockAIValidator.validateReport.mockResolvedValue({
                score: 45,
                reason: 'Description is too vague',
                confidence: 0.8,
                breakdown: {
                    imageScore: 15,
                    descriptionScore: 18,
                    categoryScore: 12
                },
                recommendations: ['Add more details about the incident']
            });
            mockDatabase.saveReport.mockResolvedValue('test-report-123');

            // Execute
            const result = await validator.validateReport(validReport);

            // Verify
            expect(result.success).toBe(true);
            expect(result.action).toBe('submitted_for_review');
            expect(result.score).toBe(45);
            expect(result.recommendations).toContain('Add more details about the incident');
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

        test('should reject report without image URL', () => {
            const invalidReport = { ...validReport };
            delete invalidReport.imageUrl;

            expect(() => validator.validateReportInput(invalidReport))
                .toThrow('Report must include an image URL');
        });

        test('should reject report with non-Cloudinary image URL', () => {
            const invalidReport = {
                ...validReport,
                imageUrl: 'https://example.com/image.jpg'
            };

            expect(() => validator.validateReportInput(invalidReport))
                .toThrow('Image must be hosted on Cloudinary');
        });

        test('should reject report with invalid image URL format', () => {
            const invalidReport = {
                ...validReport,
                imageUrl: 'not-a-url'
            };

            expect(() => validator.validateReportInput(invalidReport))
                .toThrow('Image URL must be a valid URL');
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