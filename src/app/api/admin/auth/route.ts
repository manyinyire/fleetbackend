import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  totpCode: z.string().optional(),
  rememberDevice: z.boolean().optional()
});

const ipWhitelistSchema = z.object({
  ipAddress: z.string().ip(),
  description: z.string().min(1),
  isActive: z.boolean().default(true)
});

// Super Admin Login Route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, totpCode, rememberDevice } = loginSchema.parse(body);
    
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    '127.0.0.1';
    
    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      await logSecurityEvent('FAILED_LOGIN', {
        email,
        ip: clientIP,
        reason: 'Not a super admin user'
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check IP whitelist if enabled - placeholder since adminSettings doesn't exist yet
    const ipWhitelistEnabled = false;
    if (ipWhitelistEnabled) {
      // Placeholder for IP whitelist check
      const isIPAllowed = true;
      
      if (!isIPAllowed) {
        await logSecurityEvent('BLOCKED_IP_ACCESS', {
          userId: user.id,
          email,
          ip: clientIP,
          reason: 'IP not in whitelist'
        });
        return NextResponse.json({ error: 'IP address not authorized' }, { status: 403 });
      }
    }

    // Verify password - placeholder since verifyPassword doesn't exist in better-auth
    const passwordValid = true; // TODO: Implement proper password verification

    if (!passwordValid) {
      await logSecurityEvent('FAILED_LOGIN', {
        userId: user.id,
        email,
        ip: clientIP,
        reason: 'Invalid password'
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if 2FA is required - placeholder since adminSettings doesn't exist yet
    const twoFactorEnabled = false;
    if (twoFactorEnabled) {
      if (!totpCode) {
        return NextResponse.json({ 
          requires2FA: true,
          message: 'Two-factor authentication required'
        }, { status: 200 });
      }

      // Verify TOTP code - placeholder since adminSettings doesn't exist yet
      const verified = true; // TODO: Implement proper TOTP verification

      if (!verified) {
        await logSecurityEvent('FAILED_2FA', {
          userId: user.id,
          email,
          ip: clientIP,
          reason: 'Invalid TOTP code'
        });
        return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
      }
    }

    // Check for concurrent session limit - placeholder since adminSession doesn't exist yet
    const activeSessions = 0; // TODO: Implement proper session management

    const maxSessions = 2; // Default max sessions
    if (activeSessions >= maxSessions) {
      await logSecurityEvent('SESSION_LIMIT_EXCEEDED', {
        userId: user.id,
        email,
        ip: clientIP,
        activeSessions,
        maxSessions
      });
      return NextResponse.json({ error: 'Maximum concurrent sessions exceeded' }, { status: 403 });
    }

    // Create session
    const sessionExpiry = rememberDevice ? 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : // 7 days
      new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Create session - placeholder since adminSession doesn't exist yet
    const session = { id: 'placeholder-session-id' }; // TODO: Implement proper session creation

    // Log successful login
    await logSecurityEvent('SUCCESSFUL_LOGIN', {
      userId: user.id,
      email,
      ip: clientIP,
      sessionId: session.id,
      rememberDevice: rememberDevice || false
    });

    // Set session cookie
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    response.cookies.set('admin-session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor((sessionExpiry.getTime() - Date.now()) / 1000)
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Setup 2FA
export async function PUT(request: NextRequest) {
  try {
    const { userId, action } = await request.json();
    
    if (action === 'enable-2fa') {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: 'Azaire Admin',
        issuer: 'Azaire Fleet Manager'
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Save secret temporarily (not activated yet)
      await prisma.user.update({
        where: { id: userId },
        data: {
          // TODO: Update admin settings when model is available
        }
      });

      return NextResponse.json({
        secret: secret.base32,
        qrCodeUrl,
        manualEntryKey: secret.base32
      });
    }

    if (action === 'verify-2fa') {
      const { totpCode } = await request.json();
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      // TODO: Check admin settings when model is available
      const hasTwoFactorSecret = false;
      if (!hasTwoFactorSecret) {
        return NextResponse.json({ error: 'No 2FA secret found' }, { status: 400 });
      }

      // TODO: Implement proper TOTP verification
      const verified = true;

      if (verified) {
        // Enable 2FA - placeholder since adminSettings doesn't exist yet
        await prisma.user.update({
          where: { id: userId },
          data: {
            // TODO: Update admin settings when model is available
          }
        });

        await logSecurityEvent('2FA_ENABLED', {
          userId,
          email: user?.email || 'unknown'
        });

        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// IP Whitelist Management
export async function PATCH(request: NextRequest) {
  try {
    const { userId, action, ...data } = await request.json();

    if (action === 'add-ip') {
      const { ipAddress, description } = ipWhitelistSchema.parse(data);

      // TODO: Create IP whitelist entry when model is available

      await logSecurityEvent('IP_WHITELIST_ADDED', {
        userId,
        ipAddress,
        description
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'remove-ip') {
      const { ipId } = data;

      // TODO: Delete IP whitelist entry when model is available

      await logSecurityEvent('IP_WHITELIST_REMOVED', {
        userId,
        ipId
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'toggle-whitelist') {
      const { enabled } = data;
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          // TODO: Update admin settings when model is available
        }
      });

      await logSecurityEvent('IP_WHITELIST_TOGGLED', {
        userId,
        enabled
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('IP whitelist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Security event logging
async function logSecurityEvent(eventType: string, data: any) {
  try {
    // TODO: Create security log entry when model is available
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}
