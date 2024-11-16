/**
 * Basic input sanitization
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Remove any HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Convert special characters to HTML entities
    sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    return sanitized;
}
