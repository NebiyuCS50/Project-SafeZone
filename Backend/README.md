# AI Report Validation Service

A self-contained, testable AI validation service for incident reports that can decide whether a report is valid, reject it with feedback up to 3 times, and only then forward it to Firebase for admin review.

## Features

- 🤖 **AI-Powered Validation**: Uses OpenAI GPT-4o-mini to analyze report consistency, completeness, and realism
- 🔄 **Retry Logic**: Allows users to improve and resubmit reports up to 3 times
- 🛡️ **Security**: No secrets exposed to frontend, all AI logic contained server-side
- 📊 **Comprehensive Testing**: Full unit test coverage with Jest
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

### Validate Report
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
  "userId": "user-123"
}
```

**Response (Accepted):**
```json
{
  "success": true,
  "action": "accepted",
  "score": 85,
  "attempts": 1,
  "message": "Report accepted successfully",
  "reason": "Report is detailed and consistent"
}
```

**Response (Rejected - Can Retry):**
```json
{
  "success": false,
  "action": "rejected",
  "score": 45,
  "attempts": 1,
  "maxAttempts": 3,
  "message": "Report rejected. 2 attempts remaining.",
  "reason": "Description is too vague",
  "suggestions": ["Add more details about the incident"],
  "canRetry": true
}
```

**Response (Forwarded to Admin):**
```json
{
  "success": false,
  "action": "forwarded_to_admin",
  "attempts": 3,
  "maxAttempts": 3,
  "message": "Maximum validation attempts exceeded. Report forwarded to admin for manual review.",
  "canRetry": false
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

### Report History
```http
GET /api/report-history?reportId=unique-report-id
```

## Architecture

### Services

- **`AIValidator`**: Handles all OpenAI interactions and response parsing
- **`ReportValidator`**: Main orchestration service with rejection logic
- **`ReportDatabase`**: Abstracts Firebase operations
- **`EnvironmentConfig`**: Validates and provides environment variables

### Validation Flow

1. **Input Validation**: Check required fields and data formats
2. **AI Analysis**: Send report to OpenAI for consistency scoring
3. **Decision Logic**:
   - Score ≥ 70: Accept report
   - Score < 70: Reject with feedback
   - After 3 rejections: Forward to admin review
4. **Database Updates**: Store validation history and status

### Security Considerations

- ✅ **No API Keys Exposed**: All AI calls happen server-side
- ✅ **Input Sanitization**: All inputs validated before processing
- ✅ **Rate Limiting**: Configurable rate limiting available
- ✅ **Error Handling**: Comprehensive error responses without leaking sensitive data
- ✅ **Environment Validation**: Required secrets validated on startup

## Configuration

All configuration is done via environment variables. See `.env.example` for all available options.

### Key Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `VALIDATION_MAX_ATTEMPTS` | 3 | Maximum retry attempts before forwarding to admin |
| `VALIDATION_PASS_THRESHOLD` | 70 | Minimum score required for acceptance |
| `OPENAI_MODEL` | gpt-4o-mini | AI model to use for validation |
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

- **Health Check**: `/api/health` - AI service and database connectivity
- **Statistics**: `/api/validation-stats` - Acceptance rates and totals
- **Report History**: `/api/report-history` - Individual report validation attempts

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