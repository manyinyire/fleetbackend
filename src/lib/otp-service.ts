import { prisma } from './prisma';
import { emailService } from './email';
import { randomInt } from 'crypto';

class OTPService {
  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  async generateOTP(userId: string, type: 'TWO_FACTOR' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'): Promise<string> {
    const code = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

    // Clean up old OTPs for this user and type
    await prisma.oTP.deleteMany({
      where: {
        userId,
        type,
        used: false
      }
    });

    await prisma.oTP.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      }
    });

    return code;
  }

  async verifyOTP(code: string, userId: string, type: 'TWO_FACTOR' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION'): Promise<boolean> {
    const otp = await prisma.oTP.findFirst({
      where: {
        code,
        userId,
        type,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!otp) {
      return false;
    }

    // Mark as used
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { used: true }
    });

    return true;
  }

  async sendTwoFactorOTP(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('Two-factor authentication not enabled for this user');
    }

    const code = await this.generateOTP(userId, 'TWO_FACTOR');
    return emailService.sendOTPEmail(user.email, code, user.name);
  }

  async sendPasswordResetOTP(email: string): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { success: true, message: 'If an account with this email exists, an OTP has been sent' };
    }

    const code = await this.generateOTP(user.id, 'PASSWORD_RESET');
    const emailSent = await emailService.sendOTPEmail(email, code, user.name);

    return { 
      success: emailSent, 
      message: emailSent ? 'OTP sent to your email' : 'Failed to send OTP' 
    };
  }

  async sendEmailVerificationOTP(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      return true; // Already verified
    }

    const code = await this.generateOTP(userId, 'EMAIL_VERIFICATION');
    return emailService.sendOTPEmail(user.email, code, user.name);
  }

  async verifyTwoFactorOTP(code: string, userId: string): Promise<boolean> {
    return this.verifyOTP(code, userId, 'TWO_FACTOR');
  }

  async verifyPasswordResetOTP(code: string, email: string): Promise<{ success: boolean; userId?: string }> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false };
    }

    const isValid = await this.verifyOTP(code, user.id, 'PASSWORD_RESET');
    return { success: isValid, userId: isValid ? user.id : undefined };
  }

  async verifyEmailVerificationOTP(code: string, userId: string): Promise<boolean> {
    const isValid = await this.verifyOTP(code, userId, 'EMAIL_VERIFICATION');
    
    if (isValid) {
      // Update user's email verification status
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true }
      });
    }

    return isValid;
  }

  async enableTwoFactor(userId: string): Promise<{ success: boolean; secret?: string }> {
    const secret = randomBytes(20).toString('base32');
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret
      }
    });

    return { success: true, secret };
  }

  async disableTwoFactor(userId: string): Promise<boolean> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });

    return true;
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });

    return user?.twoFactorEnabled || false;
  }
}

export const otpService = new OTPService();
export default otpService;