import { requireRole } from '@/lib/auth-helpers';

export default async function SecurityPage() {
  await requireRole('SUPER_ADMIN');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Center
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor and manage platform security
          </p>
        </div>
      </div>

      {/* Security Score */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Score</h3>
          <span className="text-4xl font-bold text-green-600">92/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="bg-green-600 h-4 rounded-full" style={{ width: '92%' }}></div>
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your platform security is excellent. Keep monitoring for potential threats.
        </p>
      </div>

      {/* Active Threats */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Active Threats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Critical Issues</span>
              <span className="text-2xl font-bold text-green-600">0</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No critical security issues detected</p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Warnings</span>
              <span className="text-2xl font-bold text-yellow-600">2</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Failed login attempts detected</p>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Security Events
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          <div className="px-6 py-4 flex items-start space-x-3">
            <span className="text-xl">🟡</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                15:42 - Failed login attempt (5x) from IP 123.45.67.89
              </p>
              <div className="mt-2 flex space-x-2">
                <button className="text-xs text-indigo-600 hover:text-indigo-700">Block IP</button>
                <button className="text-xs text-gray-600 hover:text-gray-700">View Details</button>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 flex items-start space-x-3">
            <span className="text-xl">🟢</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                14:28 - 2FA enabled for user alice@azaire.com
              </p>
            </div>
          </div>
          <div className="px-6 py-4 flex items-start space-x-3">
            <span className="text-xl">🟢</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                09:15 - Security scan completed (no issues)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SSL Certificate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            SSL Certificate
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className="text-sm font-medium text-green-600">🟢 Valid</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Expires</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Dec 15, 2025 (335 days)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Issuer</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Let's Encrypt</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Database Encryption
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className="text-sm font-medium text-green-600">🟢 Enabled</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Algorithm</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">AES-256</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Backups</span>
              <span className="text-sm font-medium text-green-600">🟢 Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Run Security Scan
        </button>
        <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
          View Full Report
        </button>
      </div>
    </div>
  );
}
