'use client';

import { useSession } from 'better-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user || null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}