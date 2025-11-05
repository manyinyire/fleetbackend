'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect } from 'react';

export function useAuth() {
  const { data: session, isPending, error } = useSession();

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('useAuth debug:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        isPending,
        error: error?.message,
      });
    }
  }, [session, isPending, error]);

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    error,
  };
}