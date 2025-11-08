import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const user = await getCurrentUser();

  // If user is logged in, redirect based on role
  if (user) {
    if ((user as any).role === 'SUPER_ADMIN') {
      redirect('/admin/dashboard');
    } else {
      redirect('/dashboard');
    }
  }

  // If not logged in, show landing page
  redirect('/landing');
}