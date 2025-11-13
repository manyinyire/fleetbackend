import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getSystemHealthSnapshot } from '@/lib/system-health-data';

// GET /api/admin/system-health - Get system health metrics
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;

    if (!session?.user || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const systemHealthData = await getSystemHealthSnapshot();
    return NextResponse.json(systemHealthData);

  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health data' },
      { status: 500 }
    );
  }
}