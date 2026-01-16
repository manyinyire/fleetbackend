'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ExpressCheckoutModalProps {
  invoiceId: string;
  amount: number;
  invoiceNumber: string;
  onSuccess: () => void;
  onClose: () => void;
}

type PaymentMethod = 'ecocash' | 'onemoney' | 'innbucks' | 'omari';

export function ExpressCheckoutModal({
  invoiceId,
  amount,
  invoiceNumber,
  onSuccess,
  onClose,
}: ExpressCheckoutModalProps) {
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('ecocash');
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [pollUrl, setPollUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Format phone number to match validation (ensure it starts with 0 or +263)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('0') && !formattedPhone.startsWith('+263')) {
      formattedPhone = '0' + formattedPhone;
    }

    try {
      const response = await fetch('/api/payments/express-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          phone: formattedPhone,
          method,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentId(data.payment.id);
        setPollUrl(data.payment.pollUrl);
        setInstructions(data.payment.instructions);
        toast.success(data.message || 'Payment initiated!');
        
        // Start polling for payment status
        startPolling(data.payment.id);
      } else {
        toast.error(data.error || 'Failed to initiate payment');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  const startPolling = async (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes (every 5 seconds)

    const poll = async () => {
      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId }),
        });

        const data = await response.json();

        if (data.success && data.payment?.status === 'PAID') {
          toast.success('Payment successful!');
          setLoading(false);
          onSuccess();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          toast.error('Payment verification timeout. Please check your payment status.');
          setLoading(false);
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setLoading(false);
        }
      }
    };

    poll();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Pay with Mobile Money
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Invoice: {invoiceNumber}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              ${amount.toFixed(2)}
            </p>
          </div>

          {!instructions ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('ecocash')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      method === 'ecocash'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">EcoCash</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('onemoney')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      method === 'onemoney'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">OneMoney</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('innbucks')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      method === 'innbucks'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">InnBucks</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('omari')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      method === 'omari'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">O'mari</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0771234567 or +263771234567"
                  required
                  pattern="^(?:\+263|0)[0-9]{9}$"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter your {method} number (e.g., 0771234567)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Payment Initiated!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  Please dial the following on your phone:
                </p>
                <div className="bg-white dark:bg-gray-800 rounded p-3 text-center">
                  <code className="text-2xl font-bold text-gray-900 dark:text-white">
                    {instructions}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                <span className="text-sm">Waiting for payment confirmation...</span>
              </div>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
