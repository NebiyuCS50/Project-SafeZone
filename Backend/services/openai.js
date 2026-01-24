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
     * @param {Object} cloudinaryAnalysis - Optional Cloudinary analysis results
     * @returns {Promise<Object>} Validation result with score and breakdown
     */
    async validateReport(report, cloudinaryAnalysis = null) {
        try {
            const prompt = this.buildValidationPrompt(report, cloudinaryAnalysis);
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
                reason: "Unable to validate report due to technical issues.",
                confidence: 0.5,
                breakdown: {
                    imageScore: 15,
                    descriptionScore: 20,
                    categoryScore: 15
                },
                recommendations: ["Please ensure all fields are filled accurately"]
            };
        }
    }

    /**
     * Builds the validation prompt for the AI
     */
    buildValidationPrompt(report, cloudinaryAnalysis = null) {
        const cloudinaryContext = cloudinaryAnalysis ? `

CLOUDINARY IMAGE ANALYSIS:
${JSON.stringify(cloudinaryAnalysis, null, 2)}

Use this Cloudinary data to inform your image quality assessment:
- AI tags help determine content relevance
- Quality metrics indicate image clarity
- Content type classification shows if image matches incident type
- Moderation status indicates if content is appropriate` : `

NO CLOUDINARY ANALYSIS AVAILABLE:
- Image URL is provided but detailed analysis not available
- Assess image quality based on URL format and description context only`;

        return `You are an expert incident report validation system for Addis Ababa safety reports.

Your task is to analyze the incident report and provide a comprehensive quality score out of 100.

Evaluate the following aspects:

1. **Image Quality (30 points)**:
   - Is there a valid Cloudinary image URL?
   - Does the image appear to be relevant to the incident?
   - Is the image clear and properly oriented?
   - Consider Cloudinary AI analysis if available (tags, quality, content type)

2. **Description Quality (40 points)**:
   - Is the description detailed and specific?
   - Does it clearly explain what happened?
   - Is the language clear and professional?
   - Does it include relevant details (time, location context, severity)?

3. **Category Appropriateness (30 points)**:
   - Does the incident type accurately match the description?
   - Is the category appropriate for the reported incident?
   - Does it align with safety reporting standards?

REPORT DETAILS:
${JSON.stringify(report, null, 2)}${cloudinaryContext}

ADDITIONAL CONTEXT:
- Location should be in Addis Ababa area (coordinates roughly 8.9-9.1°N, 38.7-38.9°E)
- Date/time should be reasonable (not future-dated)
- Image URL should be from Cloudinary (cloudinary.com in URL)

RESPONSE FORMAT (return ONLY valid JSON):
{
  "score": number (0-100, overall quality score),
  "reason": "Brief explanation of the scoring decision",
  "confidence": number (0-1, how confident you are in this assessment),
  "breakdown": {
    "imageScore": number (0-30),
    "descriptionScore": number (0-40),
    "categoryScore": number (0-30)
  },
  "recommendations": ["Array of suggestions for improvement"]
}

Provide a fair and comprehensive evaluation. This score will be used by administrators to review and prioritize reports.`;
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

            const result = await this.validateReport(testReport);
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