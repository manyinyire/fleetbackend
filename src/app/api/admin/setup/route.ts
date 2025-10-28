import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  enable2FA: z.boolean().default(false),
  enableIpWhitelist: z.boolean().default(false)
});

// Create initial Super Admin user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, enable2FA, enableIpWhitelist } = createAdminSchema.parse(body);

    // Check if any Super Admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        error: 'Super Admin already exists. Use the login page instead.' 
      }, { status: 400 });
    }

    // TODO: Hash password when better-auth provides the method
    const hashedPassword = 'placeholder-hashed-password';

    // Create Super Admin user
    const adminUser = await prisma.user.create({
      data: {
        email,
        name,
        role: 'SUPER_ADMIN',
        tenantId: null, // Super Admin has no tenant
        // TODO: Add password when field is available
        emailVerified: true
      }
    });

    // TODO: Create admin settings when model is available
    console.log('Admin settings would be created for user:', adminUser.id);

    // If IP whitelist is enabled, add current IP
    if (enableIpWhitelist) {
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
      
      // TODO: Create IP whitelist entry when model is available
      console.log('IP whitelist entry would be created:', { userId: adminUser.id, ipAddress: clientIP });
    }

    // TODO: Log admin creation when adminSecurityLog model is available
    console.log('Admin creation logged for user:', adminUser.id);

    return NextResponse.json({ 
      success: true,
      message: 'Super Admin created successfully',
      userId: adminUser.id,
      nextSteps: enable2FA ? 'Setup 2FA' : 'Login ready'
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Check if Super Admin exists
export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true, name: true }
    });

    return NextResponse.json({ 
      adminExists: !!adminExists,
      admin: adminExists
    });

  } catch (error) {
    console.error('Check admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
