'use client';

import { useEffect, useState } from 'react';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function ClearCachePage() {
  const [status, setStatus] = useState('Clearing cache...');
  const router = useRouter();

  useEffect(() => {
    const clearCache = async () => {
      try {
        setStatus('Clearing cookies...');
        
        // Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        setStatus('Clearing local storage...');
        localStorage.clear();
        
        setStatus('Clearing session storage...');
        sessionStorage.clear();

        setStatus('Signing out...');
        await signOut();
        
        setStatus('Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/auth/sign-in';
        }, 1000);

      } catch (error) {
        console.error('Error clearing cache:', error);
        setStatus('Error clearing cache. Redirecting...');
        setTimeout(() => {
          window.location.href = '/auth/sign-in';
        }, 2000);
      }
    };

    clearCache();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <h1 className="mb-2 text-center text-xl font-bold text-gray-900 dark:text-white">
          {status}
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Please wait...
        </p>
      </div>
    </div>
  );
}

