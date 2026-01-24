import OPENAI from "openai";

export const openai = new OPENAI({
    apiKey: process.env.OPENAI_API_KEY,
});
/**
 * AI Validation Service
 * Handles all AI-powered report validation logic
 */
export class AIValidator {
    constructor(openaiClient = openai) {
        this.openai = openaiClient;
        this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
        this.maxTokens = 1000;
    }

    /**
     * Validates a report using AI analysis
     * @param {Object} report - The report to validate
     * @param {number} attemptNumber - Current attempt number (1-3)
     * @returns {Promise<Object>} Validation result with score and feedback
     */
    async validateReport(report, attemptNumber = 1) {
        try {
            const prompt = this.buildValidationPrompt(report, attemptNumber);
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [{ role: "user", content: prompt }],
                max_tokens: this.maxTokens,
                temperature: 0.3, // Lower temperature for more consistent validation
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error("No response from AI service");
            }

            return this.parseAIResponse(content);
        } catch (error) {
            console.error("AI validation error:", error);
            // Return a default validation result if AI fails
            return {
                score: 50, // Neutral score when AI fails
                reason: "Unable to validate report due to technical issues. Please try again.",
                confidence: 0.5,
                suggestions: ["Please ensure all fields are filled accurately"]
            };
        }
    }

    /**
     * Builds the validation prompt for the AI
     */
    buildValidationPrompt(report, attemptNumber) {
        const attemptContext = attemptNumber > 1
            ? `This is attempt #${attemptNumber} of 3. The report has been rejected previously.`
            : "This is the first validation attempt.";

        return `You are an expert incident report validation system for Addis Ababa safety reports.

${attemptContext}

Your task is to analyze the incident report for:
1. **Consistency**: Do the details make logical sense together?
2. **Completeness**: Are all required fields properly filled?
3. **Realism**: Is this a plausible incident based on location and description?
4. **Safety**: Does this represent a genuine safety concern?

REPORT DETAILS:
${JSON.stringify(report, null, 2)}

VALIDATION CRITERIA:
- Location should be in Addis Ababa area (coordinates roughly 8.9-9.1°N, 38.7-38.9°E)
- Description should be detailed enough to understand the incident
- Incident type should match the description
- Date/time should be reasonable (not future-dated)
- Image URL should be valid if provided

RESPONSE FORMAT (return ONLY valid JSON):
{
  "score": number (0-100, where 70+ = pass, below = fail),
  "reason": "Brief explanation of validation decision",
  "confidence": number (0-1, how confident you are in this assessment),
  "suggestions": ["Array of specific improvement suggestions if rejected"]
}

Be strict but fair. Valid reports should receive 70+ scores.`;
    }

    /**
     * Parses and validates the AI response
     */
    parseAIResponse(content) {
        try {
            // Clean the response by removing any markdown formatting
            const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();

            const result = JSON.parse(cleanContent);

            // Validate the response structure
            if (typeof result.score !== 'number' ||
                result.score < 0 || result.score > 100) {
                throw new Error("Invalid score in AI response");
            }

            if (typeof result.reason !== 'string' || result.reason.trim().length === 0) {
                throw new Error("Invalid reason in AI response");
            }

            if (typeof result.confidence !== 'number' ||
                result.confidence < 0 || result.confidence > 1) {
                result.confidence = 0.5; // Default confidence
            }

            if (!Array.isArray(result.suggestions)) {
                result.suggestions = [];
            }

            return result;
        } catch (error) {
            console.error("Failed to parse AI response:", content);
            throw new Error(`Invalid AI response format: ${error.message}`);
        }
    }

    /**
     * Validates if the AI service is working
     */
    async healthCheck() {
        try {
            const testReport = {
                incidentType: "test",
                description: "Test report for health check",
                location: { lat: 9.0, lng: 38.7 },
                timestamp: Date.now()
            };

            const result = await this.validateReport(testReport, 1);
            return {
                status: "healthy",
                score: result.score,
                responseTime: Date.now()
            };
        } catch (error) {
            return {
                status: "unhealthy",
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
}

export const aiValidator = new AIValidator();