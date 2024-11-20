// Frontend Logger
// Mimics backend logger with added environment-specific features

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
    info: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    error: (...args) => {
        console.error(...args);
        // Optionally add error tracking/reporting here
    },
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    }
};

export default logger;
