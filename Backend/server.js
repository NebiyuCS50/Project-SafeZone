#!/usr/bin/env node

/**
 * Standalone AI Validation Server
 * Provides REST API endpoints for report validation
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config/environment.js';
import validateReport, { healthCheck, getValidationStats, getReportHistory } from './api/validateReport.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = config.getServerConfig().port;

// Middleware
app.use(cors({
    origin: config.getServerConfig().corsOrigins,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', healthCheck);

// Validation endpoints
app.post('/api/validate-report', validateReport);
app.get('/api/validation-stats', getValidationStats);
app.get('/api/report-history', getReportHistory);

// Root endpoint with API information
app.get('/', (req, res) => {
    res.json({
        name: 'AI Report Validation Service',
        version: '1.0.0',
        description: 'Self-contained AI validation service for incident reports',
        endpoints: {
            'POST /api/validate-report': 'Validate an incident report',
            'GET /api/health': 'Service health check',
            'GET /api/validation-stats': 'Get validation statistics',
            'GET /api/report-history': 'Get report validation history'
        },
        config: config.isDevelopment() ? config.getMaskedConfig() : 'Configuration masked in production'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);

    res.status(500).json({
        success: false,
        error: {
            type: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            details: config.isDevelopment() ? error.message : undefined
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            type: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`
        }
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 AI Validation Service running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🔧 Environment: ${config.getServerConfig().nodeEnv}`);
        console.log(`📝 API Documentation: http://localhost:${PORT}/`);
    });
}

export default app;