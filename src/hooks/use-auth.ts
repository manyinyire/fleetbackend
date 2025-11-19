'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const isPending = status === 'loading';

  // Debug logging in development
  useEffect(() => {
    // Check if we're in development (client-side check)
    const isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (isDevelopment) {
      console.log('useAuth debug:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userName: session?.user?.name,
        status,
        isPending,
        sessionData: session,
      });
      
      // Also log if user is null but not loading
      if (!isPending && !session?.user) {
        console.warn('useAuth: Session loaded but no user data found');
      }
    }
  }, [session, status, isPending]);

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: isPending,
    status,
  };
}