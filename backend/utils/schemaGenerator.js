// Utility functions for schema generation and validation

/**
 * Infers JavaScript type from a value
 * @param {any} value - The value to infer type from
 * @returns {string} Type of the value
 */
function getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

/**
 * Validates a value against a simple type check
 * @param {any} value - The value to validate
 * @param {string} expectedType - The expected type
 * @returns {boolean} Whether the value matches the expected type
 */
function validateType(value, expectedType) {
    const actualType = getType(value);
    
    switch (expectedType) {
        case 'string':
            return actualType === 'string';
        case 'number':
            return actualType === 'number';
        case 'boolean':
            return actualType === 'boolean';
        case 'date':
            return value instanceof Date;
        case 'array':
            return actualType === 'array';
        case 'object':
            return actualType === 'object' && value !== null;
        default:
            return false;
    }
}

/**
 * Generates a basic schema definition from a class instance
 * @param {Object} instance - Instance of a class
 * @param {Object} options - Additional schema options for each field
 * @returns {Object} Schema definition
 */
function generateSchema(instance, options = {}) {
    const schema = {};
    
    for (const [key, value] of Object.entries(instance)) {
        // Skip methods and undefined values
        if (typeof value === 'function' || value === undefined) continue;
        
        // Determine type
        const type = getType(value);
        
        // Create schema entry
        schema[key] = {
            type,
            required: options[key]?.required || false,
            default: options[key]?.default || value
        };
    }
    
    return schema;
}

/**
 * Decorator to automatically add schema generation to a class
 * @param {Object} options - Additional schema options for each field
 * @returns {Function} Class decorator
 */
function GenerateSchema(options = {}) {
    return function(constructor) {
        constructor.prototype.generateSchema = function() {
            return generateSchema(this, options);
        };
        
        constructor.prototype.validate = function() {
            const schema = this.generateSchema();
            
            for (const [key, schemaEntry] of Object.entries(schema)) {
                const value = this[key];
                
                // Check required fields
                if (schemaEntry.required && (value === null || value === undefined)) {
                    throw new Error(`Validation Error: ${key} is required`);
                }
                
                // Type validation
                if (value !== null && value !== undefined) {
                    if (!validateType(value, schemaEntry.type)) {
                        throw new Error(`Validation Error: ${key} must be of type ${schemaEntry.type}`);
                    }
                }
            }
            
            return true;
        };
    };
}

export { generateSchema, GenerateSchema, validateType, getType };
