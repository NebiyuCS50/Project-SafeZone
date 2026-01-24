import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/environment.js';

/**
 * Cloudinary Service
 * Handles image uploads and analysis for incident reports
 */

// Configure Cloudinary
const cloudinaryConfig = config.getCloudinaryConfig();
cloudinary.config({
    cloud_name: cloudinaryConfig.cloudName,
    api_key: cloudinaryConfig.apiKey,
    api_secret: cloudinaryConfig.apiSecret
});

/**
 * Cloudinary Service Class
 * Provides methods for image upload, analysis, and management
 */
export class CloudinaryService {
    constructor() {
        this.uploadPreset = cloudinaryConfig.uploadPreset || 'safezone_reports';
        this.folder = cloudinaryConfig.folder || 'safezone/incidents';
    }

    /**
     * Upload image buffer to Cloudinary
     * @param {Buffer} imageBuffer - Image buffer
     * @param {string} filename - Original filename
     * @param {Object} options - Additional upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadImage(imageBuffer, filename, options = {}) {
        try {
            const uploadOptions = {
                folder: this.folder,
                public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
                resource_type: 'image',
                upload_preset: this.uploadPreset,
                // Enable AI moderation
                moderation: 'aws_rek',
                // Categorize content
                categorization: 'aws_rek_tagging',
                // Auto-tagging
                auto_tagging: 0.8,
                // Generate responsive images
                responsive_breakpoints: {
                    create_derived: true,
                    bytes_step: 20000,
                    min_width: 200,
                    max_width: 1000,
                    max_images: 5
                },
                // Quality optimization
                quality: 'auto',
                // Format optimization
                format: 'auto',
                ...options
            };

            const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageBuffer.toString('base64')}`, uploadOptions);

            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
                moderation: result.moderation,
                tags: result.tags || [],
                categorization: result.categorization,
                analysis: await this.analyzeImage(result.public_id)
            };
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    /**
     * Analyze uploaded image using Cloudinary AI
     * @param {string} publicId - Cloudinary public ID
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeImage(publicId) {
        try {
            // Get detailed analysis from Cloudinary
            const [resourceInfo, tags] = await Promise.all([
                cloudinary.api.resource(publicId, {
                    image_metadata: true,
                    faces: true,
                    exif: true
                }),
                cloudinary.api.tags(publicId)
            ]);

            return {
                faces: resourceInfo.faces || [],
                metadata: resourceInfo.image_metadata || {},
                tags: tags.tags || [],
                quality: this.assessImageQuality(resourceInfo),
                contentType: this.classifyContentType(tags.tags || [])
            };
        } catch (error) {
            console.error('Image analysis error:', error);
            return {
                faces: [],
                metadata: {},
                tags: [],
                quality: 'unknown',
                contentType: 'unknown',
                error: error.message
            };
        }
    }

    /**
     * Assess image quality based on Cloudinary data
     * @param {Object} resourceInfo - Cloudinary resource info
     * @returns {string} Quality assessment
     */
    assessImageQuality(resourceInfo) {
        // Basic quality assessment
        if (!resourceInfo.width || !resourceInfo.height) {
            return 'unknown';
        }

        const resolution = resourceInfo.width * resourceInfo.height;
        const bytes = resourceInfo.bytes;

        // High quality: Good resolution and reasonable file size
        if (resolution > 1000000 && bytes < 5000000) {
            return 'high';
        }
        // Medium quality: Decent resolution
        else if (resolution > 500000) {
            return 'medium';
        }
        // Low quality: Poor resolution or very large file
        else {
            return 'low';
        }
    }

    /**
     * Classify content type based on AI tags
     * @param {Array} tags - Cloudinary AI tags
     * @returns {string} Content classification
     */
    classifyContentType(tags) {
        const tagString = tags.join(' ').toLowerCase();

        // Check for safety/incident related content
        if (tagString.includes('accident') || tagString.includes('crash') ||
            tagString.includes('damage') || tagString.includes('emergency')) {
            return 'incident';
        }

        // Check for traffic/road content
        if (tagString.includes('road') || tagString.includes('street') ||
            tagString.includes('traffic') || tagString.includes('vehicle')) {
            return 'traffic';
        }

        // Check for outdoor/urban content
        if (tagString.includes('outdoor') || tagString.includes('building') ||
            tagString.includes('city') || tagString.includes('urban')) {
            return 'urban';
        }

        return 'general';
    }

    /**
     * Delete image from Cloudinary
     * @param {string} publicId - Cloudinary public ID
     * @returns {Promise<Object>} Deletion result
     */
    async deleteImage(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return {
                success: result.result === 'ok',
                result: result.result
            };
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }

    /**
     * Generate optimized image URL with transformations
     * @param {string} publicId - Cloudinary public ID
     * @param {Object} transformations - Transformation options
     * @returns {string} Optimized URL
     */
    generateOptimizedUrl(publicId, transformations = {}) {
        const defaultTransforms = {
            quality: 'auto',
            format: 'auto',
            width: 800,
            height: 600,
            crop: 'fill',
            gravity: 'auto',
            ...transformations
        };

        return cloudinary.url(publicId, defaultTransforms);
    }

    /**
     * Validate Cloudinary URL format
     * @param {string} url - URL to validate
     * @returns {boolean} Is valid Cloudinary URL
     */
    static isValidCloudinaryUrl(url) {
        if (!url || typeof url !== 'string') return false;

        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes('cloudinary.com') ||
                   urlObj.hostname.includes('res.cloudinary.com');
        } catch {
            return false;
        }
    }

    /**
     * Extract public ID from Cloudinary URL
     * @param {string} url - Cloudinary URL
     * @returns {string|null} Public ID or null if invalid
     */
    static extractPublicId(url) {
        if (!this.isValidCloudinaryUrl(url)) return null;

        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);
            // Remove 'upload' or other prefixes and file extension
            const publicIdWithExt = pathParts.slice(1).join('/');
            return publicIdWithExt.replace(/\.[^/.]+$/, '');
        } catch {
            return null;
        }
    }

    /**
     * Health check for Cloudinary service
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            // Test basic API connectivity
            const result = await cloudinary.api.ping();
            return {
                status: 'healthy',
                cloudName: cloudinaryConfig.cloudName,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

export const cloudinaryService = new CloudinaryService();