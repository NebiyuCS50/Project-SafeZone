# AI Report Validation Service

A self-contained, testable AI validation service for incident reports with Cloudinary integration. Reports are evaluated for quality using AI analysis of images, descriptions, and categories, then stored for admin review with comprehensive scoring.

## Features

- 🖼️ **Cloudinary Integration**: Automatic image upload, optimization, and AI analysis
- 🤖 **AI-Powered Scoring**: Comprehensive quality evaluation using OpenAI GPT-4o-mini
- 📊 **Quality Metrics**: Detailed scoring breakdown (image, description, category)
- 🛡️ **Single Submission**: All reports accepted and scored for admin review
- 🔒 **Secure**: No secrets exposed to frontend, all processing server-side
- 📈 **Analytics**: Quality distribution tracking and reporting
- 🔍 **Monitoring**: Health checks and validation statistics
- 🏗️ **Modular Architecture**: Separated concerns for easy maintenance and testing

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key
- Firebase project

### Installation

1. **Clone and navigate to backend:**
   ```bash
   cd Backend/
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run the service:**
   ```bash
   npm start
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

## API Endpoints

### Core Endpoints
```http
POST /api/upload-image
Content-Type: multipart/form-data

Form Data:
- image: [image file]
- folder: (optional) [custom folder name]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/project/image.jpg",
    "publicId": "safezone/incidents/1640995200-image",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "bytes": 245760,
    "analysis": {
      "quality": "high",
      "contentType": "incident",
      "tags": ["road", "accident", "vehicle"],
      "facesDetected": 0
    }
  }
}
```

### Validate and Store Report
```http
POST /api/validate-report
Content-Type: application/json

{
  "id": "unique-report-id",
  "incidentType": "accident",
  "description": "Detailed description of the incident",
  "location": {
    "lat": 9.01,
    "lng": 38.76
  },
  "timestamp": 1640995200000,
  "userId": "user-123",
  "imageUrl": "https://res.cloudinary.com/project/image.jpg"
}
```

**Response (Submitted for Review):**
```json
{
  "success": true,
  "action": "submitted_for_review",
  "score": 85,
  "breakdown": {
    "imageScore": 28,
    "descriptionScore": 35,
    "categoryScore": 22
  },
  "message": "Report submitted successfully and is pending admin review",
  "reason": "Report demonstrates good quality across all criteria",
  "recommendations": ["Consider adding more specific location details"],
  "confidence": 0.9,
  "cloudinaryAnalysis": {
    "quality": "high",
    "contentType": "incident",
    "tags": ["road", "accident", "vehicle"]
  }
}
```

### Health Check
```http
GET /api/health
```

### Validation Statistics
```http
GET /api/validation-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReports": 150,
    "pendingReview": 45,
    "reviewedReports": 105,
    "averageScore": 72.5,
    "qualityDistribution": {
      "high": 65,    // >= 80
      "medium": 35,  // 60-79
      "low": 5       // < 60
    }
  }
}
```

### Report Details
```http
GET /api/report-details?reportId=unique-report-id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "unique-report-id",
    "incidentType": "accident",
    "description": "Car accident on Bole Road",
    "location": { "lat": 9.01, "lng": 38.76 },
    "imageUrl": "https://res.cloudinary.com/project/image.jpg",
    "qualityScore": 85,
    "scoreBreakdown": {
      "imageScore": 28,
      "descriptionScore": 35,
      "categoryScore": 22
    },
    "aiReason": "Report demonstrates good quality across all criteria",
    "aiRecommendations": ["Consider adding more specific location details"],
    "aiConfidence": 0.9,
    "status": "pending_admin_review",
    "validatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Architecture

### Services

- **`AIValidator`**: Handles all OpenAI interactions and response parsing with Cloudinary analysis
- **`ReportValidator`**: Main orchestration service for quality scoring
- **`ReportDatabase`**: Abstracts Firebase operations for report storage
- **`CloudinaryService`**: Manages image uploads, optimization, and AI analysis
- **`EnvironmentConfig`**: Validates and provides environment variables

### Validation Flow

1. **Image Upload**: Upload image to Cloudinary with AI analysis
2. **Input Validation**: Check required fields and Cloudinary URLs
3. **AI Analysis**: Evaluate report quality using OpenAI with Cloudinary insights
4. **Quality Scoring**: Generate comprehensive score (0-100) with breakdown
5. **Admin Storage**: Store scored report for administrator review
6. **Response**: Return quality score and recommendations to user

### Security Considerations

- ✅ **No API Keys Exposed**: All AI calls happen server-side
- ✅ **Input Sanitization**: All inputs validated before processing
- ✅ **Rate Limiting**: Configurable rate limiting available
- ✅ **Error Handling**: Comprehensive error responses without leaking sensitive data
- ✅ **Environment Validation**: Required secrets validated on startup

## Configuration

All configuration is done via environment variables. See `.env.example` for all available options.

### Required Settings

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for AI validation |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### Optional Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_MODEL` | gpt-4o-mini | AI model to use for validation |
| `CLOUDINARY_UPLOAD_PRESET` | safezone_reports | Cloudinary upload preset |
| `CLOUDINARY_FOLDER` | safezone/incidents | Cloudinary upload folder |
| `PORT` | 3001 | Server port |
| `OPENAI_TEMPERATURE` | 0.3 | AI creativity level (lower = more consistent) |

## Testing

Run the full test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Coverage

- ✅ **AIValidator**: OpenAI integration and response parsing
- ✅ **ReportValidator**: Main validation logic and retry handling
- ✅ **ReportDatabase**: Firebase operations abstraction
- ✅ **Error Handling**: Comprehensive error scenarios
- ✅ **Configuration**: Environment variable validation

## Development

### Project Structure

```
Backend/
├── api/                 # API route handlers
├── services/           # Business logic services
├── config/            # Configuration management
├── tests/             # Unit tests
├── server.js          # Express server
├── package.json       # Dependencies and scripts
├── jest.config.js     # Test configuration
└── .env.example       # Environment template
```

### Adding New Validation Rules

1. Update the AI prompt in `AIValidator.buildValidationPrompt()`
2. Add validation logic in `ReportValidator.validateReportInput()`
3. Update tests accordingly
4. Run tests to ensure everything works

### Monitoring

The service provides several monitoring endpoints:

- **Health Check**: `/api/health` - AI, Cloudinary, and database connectivity
- **Statistics**: `/api/validation-stats` - Quality scores and distribution
- **Report Details**: `/api/report-details` - Individual report information with scores

## Deployment

### Vercel (Recommended)

1. Set environment variables in Vercel dashboard
2. Deploy with default configuration

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Standalone

```bash
NODE_ENV=production npm start
```

## Contributing

1. Write tests for new features
2. Ensure all tests pass
3. Update documentation
4. Follow existing code style

## License

ISC