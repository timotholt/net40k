// Basic logger implementation
const logConfig = {
    // Configure log filtering here
    ignorePaths: ['/users', '/login', '/register'],
    ignoreTypes: ['user-request']
};

const logger = {
    config: logConfig,
    
    _shouldLog(type, path) {
        // Check if the log should be suppressed based on configuration
        if (logConfig.ignorePaths && logConfig.ignorePaths.some(p => path?.includes(p))) {
            return false;
        }
        if (logConfig.ignoreTypes && logConfig.ignoreTypes.includes(type)) {
            return false;
        }
        return true;
    },

    info: (message, meta = {}) => {
        if (logger._shouldLog(meta.type, meta.path)) {
            console.log(message, meta);
        }
    },
    error: (message, meta = {}) => {
        if (logger._shouldLog(meta.type, meta.path)) {
            console.error(message, meta);
        }
    },
    warn: (message, meta = {}) => {
        if (logger._shouldLog(meta.type, meta.path)) {
            console.warn(message, meta);
        }
    },
    debug: (message, meta = {}) => {
        if (logger._shouldLog(meta.type, meta.path)) {
            console.debug(message, meta);
        }
    }
};

export default logger;
