import logger from '../utils/logger.js';

// Stub EmailService for development
export class EmailService {
    static async sendPasswordResetEmail(email, resetToken) {
        logger.info(`[DEV] Password reset email would be sent to ${email} with token ${resetToken}`);
        return true;
    }

    static async sendVerificationEmail(email, verificationToken) {
        logger.info(`[DEV] Verification email would be sent to ${email} with token ${verificationToken}`);
        return true;
    }
}
