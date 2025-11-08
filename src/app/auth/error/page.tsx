'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Home, Mail } from 'lucide-react';
import { signOut } from '@/lib/auth-client';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get('type');

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth/sign-in';
  };

  const getErrorDetails = () => {
    switch (errorType) {
      case 'no_tenant':
        return {
          title: 'Account Configuration Error',
          description: 'Your account is not associated with any organization. This is a data integrity issue that requires administrator intervention.',
          details: [
            'Your user account exists but is not linked to any tenant/organization',
            'This should not happen in normal operation',
            'Please contact system administrator to resolve this issue',
          ],
          action: 'Contact Administrator',
        };
      case 'tenant_not_found':
        return {
          title: 'Organization Not Found',
          description: 'Your account is linked to an organization that no longer exists in the system.',
          details: [
            'Your account references a tenant/organization that cannot be found',
            'The organization may have been deleted',
            'Please contact system administrator to resolve this issue',
          ],
          action: 'Contact Administrator',
        };
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected authentication error occurred.',
          details: [
            'An unknown error occurred during authentication',
            'Please try signing in again',
            'If the problem persists, contact system administrator',
          ],
          action: 'Try Again',
        };
    }
  };

  const error = getErrorDetails();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Error Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            {error.title}
          </h2>

          {/* Error Description */}
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {error.description}
          </p>

          {/* Error Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">
              What happened:
            </h3>
            <ul className="space-y-2">
              {error.details.map((detail, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Error Code */}
          {errorType && (
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Error Code: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{errorType}</code>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Home className="h-4 w-4" />
              Sign Out & Return to Login
            </button>

            <a
              href={`mailto:admin@yourcompany.com?subject=Account Error - ${errorType}&body=I'm experiencing an account configuration error. Error type: ${errorType}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Mail className="h-4 w-4" />
              {error.action}
            </a>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Need immediate help?{' '}
              <Link href="/landing" className="text-primary hover:text-opacity-80 font-medium">
                Go to homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
