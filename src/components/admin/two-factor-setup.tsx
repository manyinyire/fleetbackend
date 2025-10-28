'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeftIcon, CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import QRCode from 'qrcode';

interface TwoFactorSetupProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

export function TwoFactorSetup({ onComplete, onBack }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify'>('generate');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateSecret();
  }, []);

  const generateSecret = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'enable-2fa'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSecret(data.secret);
        setManualKey(data.manualEntryKey);
        setQrCodeUrl(data.qrCodeUrl);
      } else {
        setError(data.error || 'Failed to generate 2FA secret');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify-2fa',
          totpCode: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onComplete({ success: true });
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(manualKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (step === 'generate') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Setup Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Secure your admin account with 2FA
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Setup Instructions:
            </h3>
            <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Scan the QR code below or enter the manual key</li>
              <li>Enter the 6-digit code from your app to verify</li>
            </ol>
          </div>

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="text-center">
              <div className="inline-block p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <Image src={qrCodeUrl} alt="2FA QR Code" width={192} height={192} />
              </div>
            </div>
          )}

          {/* Manual Key */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Manual Entry Key:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={manualKey}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
            {copied && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Copied to clipboard!
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep('verify')}
              disabled={isLoading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Next: Verify'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Verify Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-6">
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl font-mono tracking-widest"
              placeholder="123456"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setStep('generate')}
              className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
            </button>
          </div>
        </form>

        {/* Help */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Having trouble? Make sure your device time is synchronized and try again.
          </p>
        </div>
      </div>
    </div>
  );
}
