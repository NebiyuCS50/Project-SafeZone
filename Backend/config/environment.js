/**
 * Environment Configuration
 * Validates and provides access to environment variables
 */

class EnvironmentConfig {
    constructor() {
        this.validateEnvironment();
        this.cache = {};
    }

    /**
     * Validates all required environment variables
     */
    validateEnvironment() {
        const requiredVars = [
            'OPENAI_API_KEY',
            'FIREBASE_PROJECT_ID'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missingVars.join(', ')}\n` +
                'Please set these variables in your .env file or environment.'
            );
        }

        // Validate OpenAI API key format (basic check)
        if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
            console.warn('Warning: OPENAI_API_KEY does not start with "sk-". Please verify it is correct.');
        }

        console.log(' Environment configuration validated successfully');
    }

    /**
     * Gets a required environment variable
     */
    getRequired(key, defaultValue = null) {
        const value = process.env[key] || defaultValue;
        if (!value) {
            throw new Error(`Required environment variable "${key}" is not set`);
        }
        return value;
    }

    /**
     * Gets an optional environment variable with default
     */
    getOptional(key, defaultValue = null) {
        return process.env[key] || defaultValue;
    }

    /**
     * Gets an environment variable as a number
     */
    getNumber(key, defaultValue = null) {
        const value = this.getOptional(key, defaultValue);
        if (value === null) return null;

        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error(`Environment variable "${key}" must be a valid number`);
        }
        return num;
    }

    /**
     * Gets an environment variable as a boolean
     */
    getBoolean(key, defaultValue = false) {
        const value = this.getOptional(key);
        if (value === null) return defaultValue;

        return value.toLowerCase() === 'true' || value === '1';
    }

    /**
     * Gets all AI-related configuration
     */
    getAIConfig() {
        return {
            apiKey: this.getRequired('OPENAI_API_KEY'),
            model: this.getOptional('OPENAI_MODEL', 'gpt-4o-mini'),
            maxTokens: this.getNumber('OPENAI_MAX_TOKENS', 1000),
            temperature: this.getNumber('OPENAI_TEMPERATURE', 0.3),
            timeout: this.getNumber('OPENAI_TIMEOUT', 30000)
        };
    }

    /**
     * Gets all Firebase-related configuration
     */
    getFirebaseConfig() {
        return {
            projectId: this.getRequired('FIREBASE_PROJECT_ID'),
            // Optional Firebase config - only required if using Firebase Admin SDK
            apiKey: this.getOptional('FIREBASE_API_KEY'),
            authDomain: this.getOptional('FIREBASE_AUTH_DOMAIN'),
            storageBucket: this.getOptional('FIREBASE_STORAGE_BUCKET'),
            messagingSenderId: this.getOptional('FIREBASE_MESSAGING_SENDER_ID'),
            appId: this.getOptional('FIREBASE_APP_ID')
        };
    }

    /**
     * Gets all validation-related configuration
     */
    getValidationConfig() {
        return {
            maxAttempts: this.getNumber('VALIDATION_MAX_ATTEMPTS', 3),
            passThreshold: this.getNumber('VALIDATION_PASS_THRESHOLD', 70),
            enableFeedback: this.getBoolean('VALIDATION_ENABLE_FEEDBACK', true),
            enableAIValidation: this.getBoolean('VALIDATION_ENABLE_AI', true)
        };
    }

    /**
     * Gets all server-related configuration
     */
    getServerConfig() {
        return {
            port: this.getNumber('PORT', 3001),
            nodeEnv: this.getOptional('NODE_ENV', 'development'),
            corsOrigins: this.getOptional('CORS_ORIGINS', '*').split(','),
            rateLimitEnabled: this.getBoolean('RATE_LIMIT_ENABLED', false),
            rateLimitWindow: this.getNumber('RATE_LIMIT_WINDOW_MS', 60000),
            rateLimitMax: this.getNumber('RATE_LIMIT_MAX_REQUESTS', 100)
        };
    }

    /**
     * Gets database configuration
     */
    getDatabaseConfig() {
        return {
            maxRetries: this.getNumber('DB_MAX_RETRIES', 3),
            retryDelay: this.getNumber('DB_RETRY_DELAY_MS', 1000),
            cleanupEnabled: this.getBoolean('DB_CLEANUP_ENABLED', false),
            cleanupMaxAgeDays: this.getNumber('DB_CLEANUP_MAX_AGE_DAYS', 30)
        };
    }

    /**
     * Checks if running in development mode
     */
    isDevelopment() {
        return this.getServerConfig().nodeEnv === 'development';
    }

    /**
     * Checks if running in production mode
     */
    isProduction() {
        return this.getServerConfig().nodeEnv === 'production';
    }

    /**
     * Gets all configuration for logging/debugging
     */
    getAllConfig() {
        return {
            ai: this.getAIConfig(),
            firebase: this.getFirebaseConfig(),
            validation: this.getValidationConfig(),
            server: this.getServerConfig(),
            database: this.getDatabaseConfig()
        };
    }

    /**
     * Creates a masked version of config for logging
     */
    getMaskedConfig() {
        const config = this.getAllConfig();

        // Mask sensitive information
        if (config.ai.apiKey) {
            config.ai.apiKey = this.maskString(config.ai.apiKey);
        }
        if (config.firebase.apiKey) {
            config.firebase.apiKey = this.maskString(config.firebase.apiKey);
        }

        return config;
    }

    /**
     * Masks a string for safe logging
     */
    maskString(str, visibleChars = 4) {
        if (!str || str.length <= visibleChars) return '*'.repeat(str.length);
        return str.substring(0, visibleChars) + '*'.repeat(str.length - visibleChars);
    }

    /**
     * Validates configuration values are within acceptable ranges
     */
    validateConfigValues() {
        const validation = this.getValidationConfig();
        const ai = this.getAIConfig();

        if (validation.maxAttempts < 1 || validation.maxAttempts > 10) {
            throw new Error('VALIDATION_MAX_ATTEMPTS must be between 1 and 10');
        }

        if (validation.passThreshold < 0 || validation.passThreshold > 100) {
            throw new Error('VALIDATION_PASS_THRESHOLD must be between 0 and 100');
        }

        if (ai.temperature < 0 || ai.temperature > 2) {
            throw new Error('OPENAI_TEMPERATURE must be between 0 and 2');
        }

        if (ai.maxTokens < 100 || ai.maxTokens > 4000) {
            throw new Error('OPENAI_MAX_TOKENS must be between 100 and 4000');
        }

        console.log('✅ Configuration values validated successfully');
    }
}

// Create and export singleton instance
export const config = new EnvironmentConfig();

// Validate configuration on import
config.validateConfigValues();

// Export for convenience
export default config;