'use client';

import { useSession } from '@/lib/auth-client';

export function useAuth() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    status,
  };
}