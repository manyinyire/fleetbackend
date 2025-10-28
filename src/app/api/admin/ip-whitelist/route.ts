import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Get admin settings when model is available
    const adminSettings = null;

    // TODO: Get IP whitelist when model is available
    const ipWhitelist: any[] = [];

    return NextResponse.json({
      isEnabled: false, // TODO: Get from admin settings when available
      whitelist: ipWhitelist
    });

  } catch (error) {
    console.error('IP whitelist fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
