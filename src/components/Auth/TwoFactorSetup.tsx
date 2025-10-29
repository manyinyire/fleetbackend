'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheckIcon, QrCodeIcon } from '@heroicons/react/24/outline';

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleEnable2FA = async () => {
    setIsEnabling(true);
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSecret(data.secret);
        setIsEnabled(true);
        toast.success('Two-factor authentication enabled');
        onComplete?.();
      } else {
        toast.error(data.error || 'Failed to enable 2FA');
      }
    } catch (error) {
      toast.error('An error occurred while enabling 2FA');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(false);
        setSecret(null);
        toast.success('Two-factor authentication disabled');
      } else {
        toast.error(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      toast.error('An error occurred while disabling 2FA');
    }
  };

  if (isEnabled && secret) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center">
          <ShieldCheckIcon className="h-8 w-8 text-green-500 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Two-Factor Authentication Enabled
            </h3>
            <p className="text-sm text-gray-500">
              Your account is now protected with 2FA
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Secret Key (Save this securely):
            </h4>
            <code className="text-sm text-gray-800 break-all">{secret}</code>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Use this secret key to set up your authenticator app (Google Authenticator, Authy, etc.)
            </p>
          </div>

          <button
            onClick={handleDisable2FA}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Disable 2FA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center">
        <ShieldCheckIcon className="h-8 w-8 text-gray-400 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-500">
            Add an extra layer of security to your account
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            How it works:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You'll receive a 6-digit code via email when logging in</li>
            <li>• Enter the code to complete the login process</li>
            <li>• Codes expire after 10 minutes for security</li>
          </ul>
        </div>

        <div className="mt-6">
          <button
            onClick={handleEnable2FA}
            disabled={isEnabling}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnabling ? 'Enabling...' : 'Enable 2FA'}
          </button>
        </div>
      </div>
    </div>
  );
}