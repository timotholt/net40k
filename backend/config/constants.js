import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Security settings
export const PASSWORD_SALT_ROUNDS = 10;  // Standard bcrypt salt rounds - changing this invalidates existing passwords

// Load verification token expiry from env (24 hours in ms default)
export const VERIFICATION_TOKEN_EXPIRY = parseInt(process.env.VERIFICATION_TOKEN_EXPIRY || '86400000', 10);
