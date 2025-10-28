import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';

export default async function RootPage() {
  const user = await getCurrentUser();

  // If user is logged in, redirect based on role
  if (user) {
    if (user.role === 'SUPER_ADMIN') {
      redirect('/admin/dashboard');
    } else {
      redirect('/dashboard');
    }
  }

  // If not logged in, redirect to login
  redirect('/auth/sign-in');
}