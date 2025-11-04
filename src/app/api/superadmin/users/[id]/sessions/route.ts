import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireRole('SUPER_ADMIN');

    // Use BetterAuth admin plugin to list user sessions
    const headersList = await headers();
    const sessions = await auth.api.listUserSessions({
      body: {
        userId: id,
      },
      headers: headersList,
    });

    return NextResponse.json({
      success: true,
      data: sessions
    });
  } catch (error: any) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list user sessions' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireRole('SUPER_ADMIN');

    // Use BetterAuth admin plugin to revoke all user sessions
    const headersList = await headers();
    await auth.api.revokeUserSessions({
      body: {
        userId: id,
      },
      headers: headersList,
    });

    return NextResponse.json({
      success: true,
      message: 'All user sessions revoked successfully'
    });
  } catch (error: any) {
    console.error('Revoke sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke user sessions' },
      { status: 500 }
    );
  }
}

