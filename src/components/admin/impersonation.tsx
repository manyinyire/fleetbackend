"use client";

import { useState } from 'react';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImpersonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export function ImpersonationModal({ isOpen, onClose, tenantId }: ImpersonationModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for impersonation');
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll redirect to the tenant dashboard with a special parameter
      // In a real implementation, you'd create a proper impersonation session
      const impersonationUrl = `/dashboard?impersonate=${tenantId}&reason=${encodeURIComponent(reason)}`;
      window.location.href = impersonationUrl;
    } catch (error) {
      console.error('Impersonation failed:', error);
      alert('Failed to start impersonation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 sm:mx-0 sm:h-10 sm:w-10">
                <UserIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Impersonate Tenant
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You are about to impersonate this tenant. All your actions will be logged and audited.
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason for impersonation (required)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    rows={3}
                    placeholder="e.g., Customer support - investigating login issues"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleImpersonate}
              disabled={isLoading || !reason.trim()}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting...' : 'Start Impersonation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ImpersonationBannerProps {
  tenantName: string;
  onStop: () => void;
}

export function ImpersonationBanner({ tenantName, onStop }: ImpersonationBannerProps) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <UserIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Impersonating:</strong> {tenantName}
          </p>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            You are currently impersonating this tenant. All actions are logged and audited.
          </p>
        </div>
        <div className="ml-3 flex-shrink-0">
          <button
            onClick={onStop}
            className="inline-flex rounded-md bg-yellow-50 dark:bg-yellow-800 p-1.5 text-yellow-500 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 dark:focus:ring-offset-yellow-900"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
