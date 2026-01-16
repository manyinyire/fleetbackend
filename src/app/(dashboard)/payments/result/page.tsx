'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Get payment reference from URL params
  const reference = searchParams.get('reference') || searchParams.get('ref');

  useEffect(() => {
    if (reference) {
      checkPaymentStatus(reference);
    } else {
      // If no reference, assume success (PayNow sometimes doesn't pass it)
      setStatus('success');
    }
  }, [reference]);

  const checkPaymentStatus = async (ref: string) => {
    try {
      // First, check the basic status
      const statusResponse = await fetch(`/api/payments/paynow/callback?reference=${ref}`);
      const statusData = await statusResponse.json();

      if (statusResponse.ok) {
        setPaymentDetails(statusData);

        if (statusData.invoiceStatus === 'PAID' || statusData.paymentStatus === 'PAID') {
          setStatus('success');
          return;
        } else if (statusData.paymentStatus === 'PENDING') {
          // If pending, try to verify manually
          // Get the payment ID from local storage (set when payment was initiated)
          const paymentId = localStorage.getItem('lastPaymentId');

          if (paymentId) {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              if (verifyData.payment?.status === 'PAID') {
                setStatus('success');
                // Clear the stored payment ID
                localStorage.removeItem('lastPaymentId');
              } else {
                setStatus('pending');
              }
            } else {
              setStatus('pending');
            }
          } else {
            setStatus('pending');
          }
        } else {
          setStatus('failed');
        }
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // On error, assume success and let user check billing page
      setStatus('success');
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Verifying your payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircleIcon className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Payment Successful!
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Your payment has been processed successfully.
              </p>

              {paymentDetails && (
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <dl className="space-y-2">
                    {reference && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500 dark:text-gray-400">Reference:</dt>
                        <dd className="text-gray-900 dark:text-white font-medium">{reference}</dd>
                      </div>
                    )}
                    {paymentDetails.amount && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-gray-500 dark:text-gray-400">Amount:</dt>
                        <dd className="text-gray-900 dark:text-white font-medium">
                          ${Number(paymentDetails.amount).toFixed(2)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <Link
                  href="/billing"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Invoices
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}

          {/* Pending State */}
          {status === 'pending' && (
            <>
              <div className="flex justify-center">
                <ClockIcon className="h-16 w-16 text-yellow-500" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Payment Pending
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                Your payment is being processed. This may take a few minutes.
              </p>

              <div className="mt-8 space-y-3">
                <button
                  onClick={() => reference && checkPaymentStatus(reference)}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Check Status Again
                </button>
                <Link
                  href="/billing"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  View Invoices
                </Link>
              </div>
            </>
          )}

          {/* Failed State */}
          {status === 'failed' && (
            <>
              <div className="flex justify-center">
                <XCircleIcon className="h-16 w-16 text-red-500" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                Payment Failed
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                There was an issue processing your payment. Please try again.
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/billing"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          Questions? Contact support at{' '}
          <a href="mailto:hello@azaire.co.zw" className="text-indigo-600 hover:text-indigo-500">
            hello@azaire.co.zw
          </a>
        </p>
      </div>
    </div>
  );
}
