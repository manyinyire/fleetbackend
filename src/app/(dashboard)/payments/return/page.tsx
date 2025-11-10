'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * PayNow Return Page
 * This page receives users after they complete payment on PayNow
 * It extracts payment/invoice details and redirects to success page
 */
export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get parameters from PayNow redirect
    const reference = searchParams.get('reference'); // Invoice number
    const paynowreference = searchParams.get('paynowreference');
    const pollurl = searchParams.get('pollurl');

    // Try to extract payment ID and invoice ID from URL or reference
    // PayNow might include additional params we can use

    // If we have a reference (invoice number), we can lookup the invoice and payment
    if (reference) {
      // Redirect to success page which will verify the payment
      // We'll lookup the payment based on the invoice reference
      fetchPaymentByInvoice(reference);
    } else {
      // No reference, redirect to billing page
      router.push('/billing');
    }
  }, [searchParams, router]);

  const fetchPaymentByInvoice = async (invoiceNumber: string) => {
    try {
      // Find the payment for this invoice
      const response = await fetch(`/api/payments/paynow/callback?reference=${invoiceNumber}`);
      const data = await response.json();

      if (data.invoiceStatus === 'PAID') {
        // Payment already confirmed, get invoice ID
        const invoiceResponse = await fetch(`/api/invoices?invoiceNumber=${invoiceNumber}`);
        const invoiceData = await invoiceResponse.json();

        if (invoiceData.data?.invoices?.[0]) {
          const invoice = invoiceData.data.invoices[0];
          const payment = invoice.payments?.[0];

          // Redirect to success page with payment and invoice IDs
          router.push(`/payments/success?paymentId=${payment?.id || ''}&invoiceId=${invoice.id}`);
        } else {
          router.push('/billing');
        }
      } else {
        // Payment not yet confirmed, show loading or redirect to billing
        router.push('/billing');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      router.push('/billing');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Processing Payment
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we confirm your payment...
        </p>
      </div>
    </div>
  );
}
