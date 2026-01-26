/**
 * Input Sanitization Utilities
 * Protects against XSS attacks
 */

/**
 * Sanitizes HTML content to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(input) {
    if (typeof input !== 'string') return input;

    // Remove potentially dangerous HTML tags and attributes
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/<[^>]+>/g, ''); // Remove all HTML tags
}

/**
 * Sanitizes user input for display
 * @param {string} input - User input
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
}

/**
 * Escapes HTML special characters
 * @param {string} input - String to escape
 * @returns {string} Escaped string
 */
export function escapeHTML(input) {
    if (typeof input !== 'string') return input;

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return input.replace(/[&<>"']/g, (m) => map[m]);
}
