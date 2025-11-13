import { prisma } from './prisma';
import { emailService } from './email';
import { randomBytes } from 'crypto';

class EmailVerificationService {
  async generateVerificationToken(userId: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR'): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    await prisma.emailVerification.create({
      data: {
        userId,
        token,
        type,
        expiresAt,
      }
    });

    return token;
  }

  async verifyToken(token: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR'): Promise<{ valid: boolean; userId?: string }> {
    const verification = await prisma.emailVerification.findFirst({
      where: {
        token,
        type,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!verification) {
      return { valid: false };
    }

    // Mark as used
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true }
    });

    return { valid: true, userId: verification.userId };
  }

  async sendEmailVerification(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      return true; // Already verified
    }

    const token = await this.generateVerificationToken(userId, 'EMAIL_VERIFICATION');
    return emailService.sendVerificationEmail(user.email, token, user.name);
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const result = await this.verifyToken(token, 'EMAIL_VERIFICATION');

    if (!result.valid) {
      return { success: false, message: 'Invalid or expired verification token' };
    }

    // Update user's email verification status
    const user = await prisma.user.update({
      where: { id: result.userId! },
      data: { emailVerified: true },
      include: { tenant: true }
    });

    // Send welcome email after successful verification
    try {
      await emailService.sendWelcomeEmail(
        user.email,
        user.name,
        user.tenant?.plan || 'FREE'
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the verification if email fails
    }

    return { success: true, message: 'Email verified successfully' };
  }

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { success: true, message: 'If an account with this email exists, a password reset link has been sent' };
    }

    const { appConfig } = await import('@/config/app');
    const token = await this.generateVerificationToken(user.id, 'PASSWORD_RESET');
    const resetUrl = `${appConfig.baseUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #495057; margin-top: 0;">Hi ${user.name}!</h2>
            
            <p>You requested to reset your password for your Fleet Manager account. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px;">If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="color: #6c757d; font-size: 14px; word-break: break-all;">${resetUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              This password reset link will expire in 24 hours. If you didn't request this reset, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const emailSent = await emailService.sendEmail({
      to: email,
      subject: 'Password Reset - Fleet Manager',
      html,
    });

    return { success: emailSent, message: emailSent ? 'Password reset email sent' : 'Failed to send password reset email' };
  }
}

export const emailVerificationService = new EmailVerificationService();
export default emailVerificationService;