/**
 * Wraps async route handlers to automatically catch and forward errors to Express error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler that forwards errors to next()
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
