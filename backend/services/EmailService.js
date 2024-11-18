// Stub EmailService for development
export class EmailService {
    static async sendPasswordResetEmail(email, resetToken) {
        console.log(`[DEV] Password reset email would be sent to ${email} with token ${resetToken}`);
        return true;
    }

    static async sendVerificationEmail(email, verificationToken) {
        console.log(`[DEV] Verification email would be sent to ${email} with token ${verificationToken}`);
        return true;
    }
}
