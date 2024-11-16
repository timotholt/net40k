import mongoose from 'mongoose';

/**
 * Infers MongoDB schema type from a JavaScript value
 * @param {any} value - The value to infer type from
 * @returns {Object} MongoDB schema type definition
 */
function inferSchemaType(value) {
    switch (typeof value) {
        case 'string':
            return { type: String };
        case 'number':
            return { type: Number };
        case 'boolean':
            return { type: Boolean };
        case 'object':
            if (value instanceof Date) {
                return { type: Date };
            } else if (Array.isArray(value)) {
                return { type: [inferSchemaType(value[0])] };
            } else if (value === null) {
                return { type: mongoose.Schema.Types.Mixed };
            } else {
                return { type: Object };
            }
        default:
            return { type: mongoose.Schema.Types.Mixed };
    }
}

/**
 * Generates a MongoDB schema from a class instance
 * @param {Object} instance - Instance of a class
 * @param {Object} options - Additional schema options for each field
 * @returns {Object} MongoDB schema definition
 */
export function generateSchema(instance, options = {}) {
    const schema = {};
    const defaultValues = {};

    // Create a temporary instance to get default values
    const tempInstance = new instance.constructor();

    // Get all properties from the instance
    for (const [key, value] of Object.entries(instance)) {
        const schemaType = inferSchemaType(value);
        const fieldOptions = options[key] || {};
        
        // Get default value from the temporary instance
        const defaultValue = tempInstance[key];
        if (defaultValue !== undefined) {
            defaultValues[key] = defaultValue;
        }

        schema[key] = {
            ...schemaType,
            ...fieldOptions,
            ...(defaultValue !== undefined && { default: defaultValue })
        };
    }

    return schema;
}

/**
 * Decorator to automatically add schema generation to a class
 * @param {Object} options - Additional schema options for each field
 * @returns {Function} Class decorator
 */
export function GenerateSchema(options = {}) {
    return function(target) {
        target.generateSchema = function() {
            const instance = new target();
            return generateSchema(instance, options);
        };
        return target;
    };
}
