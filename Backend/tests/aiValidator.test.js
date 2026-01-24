const { AIValidator } = require('../services/openai.js');

// Mock OpenAI client
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn()
            }
        }
    }));
});
const OpenAI = require('openai');

describe('AIValidator', () => {
    let validator;
    let mockOpenAIClient;

    const testReport = {
        id: 'test-123',
        incidentType: 'accident',
        description: 'Car accident on Bole Road',
        location: { lat: 9.01, lng: 38.76 },
        timestamp: Date.now()
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock OpenAI client
        mockOpenAIClient = {
            chat: {
                completions: {
                    create: jest.fn()
                }
            }
        };

        // Mock the OpenAI constructor
        OpenAI.mockImplementation(() => mockOpenAIClient);

        validator = new AIValidator(mockOpenAIClient);
    });

    describe('validateReport', () => {
        test('should return valid validation result for good report', async () => {
            // Setup
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            score: 85,
                            reason: "Report is detailed and consistent",
                            confidence: 0.9,
                            suggestions: []
                        })
                    }
                }]
            };
            mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

            // Execute
            const result = await validator.validateReport(testReport);

            // Verify
            expect(result.score).toBe(85);
            expect(result.reason).toBe("Report is detailed and consistent");
            expect(result.confidence).toBe(0.9);
            expect(Array.isArray(result.suggestions)).toBe(true);
        });

        test('should handle AI service errors gracefully', async () => {
            // Setup
            mockOpenAIClient.chat.completions.create.mockRejectedValue(
                new Error('OpenAI API error')
            );

            // Execute
            const result = await validator.validateReport(testReport);

            // Verify - should return default values
            expect(result.score).toBe(50);
            expect(result.confidence).toBe(0.5);
            expect(result.suggestions).toContain('Please ensure all fields are filled accurately');
        });

        test('should handle malformed AI response', async () => {
            // Setup - Invalid JSON response
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Invalid JSON response'
                    }
                }]
            };
            mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

            // Execute
            const result = await validator.validateReport(testReport);

            // Verify - should return default values
            expect(result.score).toBe(50);
            expect(result.confidence).toBe(0.5);
        });

        test('should validate response structure', async () => {
            // Setup - Invalid score in response
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            score: 150, // Invalid score > 100
                            reason: "Valid reason",
                            confidence: 0.8,
                            suggestions: []
                        })
                    }
                }]
            };
            mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

            // Execute & Verify
            await expect(validator.validateReport(testReport, 1))
                .rejects.toThrow('Invalid score in AI response');
        });

        test('should include comprehensive scoring instructions in prompt', async () => {
            // Setup
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            score: 75,
                            reason: "Good quality report",
                            confidence: 0.8,
                            breakdown: {
                                imageScore: 25,
                                descriptionScore: 30,
                                categoryScore: 20
                            },
                            recommendations: []
                        })
                    }
                }]
            };
            mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

            // Execute
            await validator.validateReport(testReport);

            // Verify
            const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
            expect(callArgs.messages[0].content).toContain('comprehensive quality score');
            expect(callArgs.messages[0].content).toContain('Image Quality (30 points)');
            expect(callArgs.messages[0].content).toContain('Description Quality (40 points)');
            expect(callArgs.messages[0].content).toContain('Category Appropriateness (30 points)');
        });
    });

    describe('buildValidationPrompt', () => {
        test('should build comprehensive validation prompt', () => {
            const prompt = validator.buildValidationPrompt(testReport, 1);

            expect(prompt).toContain('Addis Ababa safety reports');
            expect(prompt).toContain('accident');
            expect(prompt).toContain('Car accident on Bole Road');
            expect(prompt).toContain('coordinates roughly 8.9-9.1°N, 38.7-38.9°E');
            expect(prompt).toMatch(/score.*number.*0-100/);
        });

        test('should build comprehensive validation prompt', () => {
            const prompt = validator.buildValidationPrompt(testReport);

            expect(prompt).toContain('comprehensive quality score out of 100');
            expect(prompt).toContain('Image Quality (30 points)');
            expect(prompt).toContain('Description Quality (40 points)');
            expect(prompt).toContain('Category Appropriateness (30 points)');
            expect(prompt).toContain('breakdown');
        });
    });

    describe('parseAIResponse', () => {
        test('should parse valid JSON response', () => {
            const validResponse = JSON.stringify({
                score: 80,
                reason: "Valid report",
                confidence: 0.9,
                breakdown: {
                    imageScore: 25,
                    descriptionScore: 35,
                    categoryScore: 20
                },
                recommendations: ["Add more details"]
            });

            const result = validator.parseAIResponse(validResponse);

            expect(result.score).toBe(80);
            expect(result.reason).toBe("Valid report");
            expect(result.confidence).toBe(0.9);
            expect(result.breakdown).toEqual({
                imageScore: 25,
                descriptionScore: 35,
                categoryScore: 20
            });
            expect(result.recommendations).toEqual(["Add more details"]);
        });

        test('should handle JSON with markdown formatting', () => {
            const markdownResponse = `\`\`\`json
{
  "score": 75,
  "reason": "Good report",
  "confidence": 0.8,
  "suggestions": []
}
\`\`\``;

            const result = validator.parseAIResponse(markdownResponse);

            expect(result.score).toBe(75);
            expect(result.reason).toBe("Good report");
        });

        test('should provide defaults for missing fields', () => {
            const incompleteResponse = JSON.stringify({
                score: 70,
                reason: "Basic report"
                // Missing confidence and suggestions
            });

            const result = validator.parseAIResponse(incompleteResponse);

            expect(result.score).toBe(70);
            expect(result.reason).toBe("Basic report");
            expect(result.confidence).toBe(0.5); // Default
            expect(result.suggestions).toEqual([]); // Default
        });

        test('should reject invalid score values', () => {
            const invalidScoreResponse = JSON.stringify({
                score: -10,
                reason: "Invalid score"
            });

            expect(() => validator.parseAIResponse(invalidScoreResponse))
                .toThrow('Invalid score in AI response');
        });

        test('should reject missing reason', () => {
            const noReasonResponse = JSON.stringify({
                score: 80
                // Missing reason
            });

            expect(() => validator.parseAIResponse(noReasonResponse))
                .toThrow('Invalid reason in AI response');
        });
    });

    describe('healthCheck', () => {
        test('should return healthy status when AI works', async () => {
            // Setup
            const mockResponse = {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            score: 90,
                            reason: "Health check successful",
                            confidence: 1.0,
                            breakdown: {
                                imageScore: 28,
                                descriptionScore: 38,
                                categoryScore: 24
                            },
                            recommendations: []
                        })
                    }
                }]
            };
            mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

            // Execute
            const health = await validator.healthCheck();

            // Verify
            expect(health.status).toBe('healthy');
            expect(health.score).toBe(90);
            expect(health.responseTime).toBeDefined();
        });

        test('should return unhealthy status when AI fails', async () => {
            // Setup
            mockOpenAIClient.chat.completions.create.mockRejectedValue(
                new Error('API key invalid')
            );

            // Execute
            const health = await validator.healthCheck();

            // Verify
            expect(health.status).toBe('unhealthy');
            expect(health.error).toBe('API key invalid');
            expect(health.timestamp).toBeDefined();
        });
    });
});