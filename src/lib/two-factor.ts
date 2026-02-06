/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP-based 2FA with QR code generation and backup codes
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { apiLogger } from './logger';

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  error?: string;
}

/**
 * Generate a new 2FA secret and QR code
 */
export async function generateTwoFactorSecret(
  userEmail: string,
  appName: string = 'Azaire Fleet Manager'
): Promise<TwoFactorSecret> {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userEmail})`,
      issuer: appName,
      length: 32,
    });

    if (!secret.otpauth_url) {
      throw new Error('Failed to generate OTP auth URL');
    }

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    apiLogger.info({ userEmail }, '2FA secret generated');

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  } catch (error) {
    apiLogger.error({ error, userEmail }, 'Failed to generate 2FA secret');
    throw new Error('Failed to generate 2FA secret');
  }
}

/**
 * Verify a TOTP token
 */
export function verifyTwoFactorToken(
  token: string,
  secret: string,
  window: number = 1
): TwoFactorVerification {
  try {
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window, // Allow 1 step before/after for clock drift
    });

    return {
      isValid,
      error: isValid ? undefined : 'Invalid or expired token',
    };
  } catch (error) {
    apiLogger.error({ error }, 'Failed to verify 2FA token');
    return {
      isValid: false,
      error: 'Verification failed',
    };
  }
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify a backup code against stored hash
 */
export function verifyBackupCode(code: string, hashedCode: string): boolean {
  const inputHash = hashBackupCode(code);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash),
    Buffer.from(hashedCode)
  );
}

/**
 * Generate a temporary 2FA token (for testing)
 */
export function generateTwoFactorToken(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
}
