import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Ensure Node.js runtime for session access

export async function GET() {
  try {
    const headersList = await headers();

    // Debug logging
    const cookies = headersList.get('cookie');
    console.log('[GET-SESSION] Cookies received:', cookies ? 'yes' : 'no');

    const session = await auth.api.getSession({
      headers: headersList,
    });

    console.log('[GET-SESSION] Session found:', session ? 'yes' : 'no', session?.user?.email || 'no user');

    if (!session) {
      return NextResponse.json({ session: null }, { status: 200 });
    }

    return NextResponse.json({ session }, { status: 200 });
  } catch (error) {
    console.error('[GET-SESSION] Session check error:', error);
    return NextResponse.json({ session: null }, { status: 200 });
  }
}
