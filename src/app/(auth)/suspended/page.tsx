'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function SuspendedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Account Suspended
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your account has been temporarily suspended
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Access Restricted
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Your account access has been suspended. This may be due to:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Outstanding payment issues</li>
                  <li>Terms of service violation</li>
                  <li>Administrative action</li>
                </ul>
                <p className="mt-3">
                  Please contact our support team to resolve this issue.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Contact support:
            </p>
            <a
              href="mailto:support@azaire.com"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              support@azaire.com
            </a>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
