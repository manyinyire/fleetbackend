import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireRole('SUPER_ADMIN');

    // List user sessions from database
    const sessions = await prisma.session.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
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

    // Revoke all user sessions by deleting them from database
    await prisma.session.deleteMany({
      where: { userId: id },
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

