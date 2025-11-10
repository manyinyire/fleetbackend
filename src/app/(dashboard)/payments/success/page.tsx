'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    const paymentIdParam = searchParams.get('paymentId');
    const invoiceIdParam = searchParams.get('invoiceId');

    if (!paymentIdParam) {
      toast.error('Payment ID not found');
      router.push('/billing');
      return;
    }

    setPaymentId(paymentIdParam);
    setInvoiceId(invoiceIdParam);

    // Verify payment status
    verifyPayment(paymentIdParam, invoiceIdParam);
  }, [searchParams, router]);

  const verifyPayment = async (paymentId: string, invoiceId: string | null) => {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });

      const data = await response.json();

      if (data.data?.success && data.data?.payment?.status === 'PAID') {
        toast.success('Payment verified successfully!');
        setVerifying(false);

        // Start countdown to redirect
        const interval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              // Redirect to invoice if we have the invoice ID
              if (invoiceId) {
                router.push(`/billing?invoiceId=${invoiceId}`);
              } else {
                router.push('/billing');
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error('Payment verification failed. Please contact support.');
        setTimeout(() => router.push('/billing'), 3000);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
      setTimeout(() => router.push('/billing'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {verifying ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we confirm your payment...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your payment has been processed successfully.
            </p>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 dark:text-green-300">
                Payment ID: <span className="font-mono">{paymentId}</span>
              </p>
              {invoiceId && (
                <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                  Invoice ID: <span className="font-mono">{invoiceId}</span>
                </p>
              )}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Redirecting to your invoice in {redirectCountdown} seconds...
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (invoiceId) {
                    router.push(`/billing?invoiceId=${invoiceId}`);
                  } else {
                    router.push('/billing');
                  }
                }}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
              >
                View Invoice Now
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
