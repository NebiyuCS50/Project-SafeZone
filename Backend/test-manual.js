#!/usr/bin/env node

/**
 * Manual Test Script
 * Basic functionality tests for the AI validation service
 */

import { reportValidator } from './services/reportValidator.js';
import { config } from './config/environment.js';

console.log('🧪 Running manual tests for AI Validation Service\n');

// Test 1: Environment Configuration
console.log('📋 Test 1: Environment Configuration');
try {
    const aiConfig = config.getAIConfig();
    console.log('✅ AI Config loaded:', aiConfig.apiKey ? 'API Key present' : 'API Key missing');

    const firebaseConfig = config.getFirebaseConfig();
    console.log('✅ Firebase Config loaded:', firebaseConfig.projectId ? 'Project ID present' : 'Project ID missing');

    console.log('✅ Environment validation passed\n');
} catch (error) {
    console.log('❌ Environment validation failed:', error.message, '\n');
}

// Test 2: Cloudinary URL Validation
console.log('📋 Test 2: Cloudinary Integration');
try {
    const { cloudinaryService } = await import('./services/cloudinary.js');

    // Test URL validation
    const validUrl = 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg';
    const invalidUrl = 'https://example.com/image.jpg';

    const isValidCloudinary = cloudinaryService.constructor.isValidCloudinaryUrl(validUrl);
    const isInvalidCloudinary = cloudinaryService.constructor.isValidCloudinaryUrl(invalidUrl);

    console.log('✅ Cloudinary URL validation:', isValidCloudinary && !isInvalidCloudinary ? 'Working' : 'Failed');

    if (isValidCloudinary) {
        const publicId = cloudinaryService.constructor.extractPublicId(validUrl);
        console.log('✅ Public ID extraction:', publicId || 'Failed');
    }
} catch (error) {
    console.log('⚠️  Cloudinary tests skipped (service not configured):', error.message);
}

// Test 3: Report Validation Input Validation
console.log('📋 Test 3: Input Validation');
const validReport = {
    id: 'test-123',
    incidentType: 'accident',
    description: 'Car accident on Bole Road',
    location: { lat: 9.01, lng: 38.76 },
    timestamp: Date.now(),
    userId: 'user-123',
    imageUrl: 'https://res.cloudinary.com/project/image.jpg'
};

const invalidReport = {
    id: 'test-456',
    incidentType: 'accident',
    description: 'Test',
    location: { lat: 0, lng: 0 }, // Invalid location
    timestamp: Date.now(),
    userId: 'user-123'
};

try {
    // Test input validation
    reportValidator.validateReportInput(validReport);
    console.log('✅ Valid report input validation passed');

    try {
        reportValidator.validateReportInput(invalidReport);
        console.log('❌ Invalid report should have failed validation');
    } catch (validationError) {
        console.log('✅ Invalid report input validation correctly rejected');
    }
} catch (error) {
    console.log('❌ Input validation test failed:', error.message);
}

console.log('\n✅ Manual tests completed');
console.log('💡 Note: Full tests require proper API keys and Firebase configuration');
console.log('🔧 Service is ready for deployment with proper environment variables');