/////////////////////////////
// NOT MY CODE
/////////////////////////////

import rateLimit from 'express-rate-limit';

const devLimits = 100;

const limits = {
    register: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5 * devLimits // 5 registrations per hour per IP
    },
    login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10 * devLimits // 10 login attempts per 15 minutes per IP
    },
    passwordReset: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3 * devLimits // 3 password reset requests per hour per IP
    },
    default: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 * devLimits // 100 requests per 15 minutes per IP
    }
};

export function createRateLimit(type = 'default') {
    const config = limits[type] || limits.default;
    
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        message: {
            success: false,
            error: `Too many requests. Please try again after ${Math.ceil(config.windowMs / 60000)} minutes.`
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false // Disable the `X-RateLimit-*` headers
    });
}
