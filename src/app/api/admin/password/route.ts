import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { z } from 'zod';

export const runtime = 'nodejs';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
  revokeOtherSessions: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword, revokeOtherSessions } = passwordChangeSchema.parse(body);

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    // Use auth API's changePassword method
    const headersList = await headers();
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOtherSessions || false,
      },
      headers: headersList,
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: revokeOtherSessions 
        ? 'Password changed successfully. All other sessions have been revoked.'
        : 'Password changed successfully.'
    });

  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to change password. Please check your current password.' 
    }, { status: 400 });
  }
}
