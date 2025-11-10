import Link from 'next/link';
import { CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { EmailVerificationPending } from '@/components/Auth/EmailVerificationPending';

export const dynamic = 'force-dynamic';

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ unverified?: string; email?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  
  // If user is verified and not unverified, redirect to dashboard
  if (user?.emailVerified && !params.unverified) {
    redirect('/dashboard');
  }

  const isUnverified = params.unverified === 'true';
  const email = params.email || user?.email || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {isUnverified ? (
            <>
              <EnvelopeIcon className="mx-auto h-16 w-16 text-blue-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Check Your Email
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                We&apos;ve sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to verify your email address.
              </p>
            </>
          ) : (
            <>
              <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your email has been successfully verified. You can now access all features of Fleet Manager.
              </p>
            </>
          )}
        </div>

        {isUnverified && email ? (
          <EmailVerificationPending email={email} />
        ) : (
          <div className="mt-8 space-y-6">
            {isUnverified ? (
              <Link
                href="/auth/sign-in"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Back to Sign In
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}