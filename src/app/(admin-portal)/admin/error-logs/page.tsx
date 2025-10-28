import { requireRole } from '@/lib/auth-helpers';

export default async function ErrorLogsPage() {
  await requireRole('SUPER_ADMIN');

  const mockErrors = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      level: 'ERROR',
      source: 'API',
      tenant: 'Doe Transport',
      message: 'Database connection timeout',
      count: 1
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      level: 'WARN',
      source: 'Queue',
      tenant: '-',
      message: 'Job retry attempt #3',
      count: 3
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      level: 'ERROR',
      source: 'Auth',
      tenant: 'ABC Fleet',
      message: 'Invalid authentication token',
      count: 5
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      level: 'ERROR',
      source: 'Payment',
      tenant: 'XYZ Delivery',
      message: 'Payment gateway timeout',
      count: 2
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Error Logs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor and troubleshoot system errors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Export Logs
          </button>
        </div>
      </div>

      {/* Error Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Errors</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">847</div>
          <div className="mt-1 text-xs text-red-600">↑ 12% from yesterday</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical</div>
          <div className="mt-1 text-3xl font-semibold text-red-600">23</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Requires attention</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Warnings</div>
          <div className="mt-1 text-3xl font-semibold text-yellow-600">142</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Monitor closely</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">0.24%</div>
          <div className="mt-1 text-xs text-green-600">↓ 0.1% from yesterday</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <select className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
            <option>All Levels</option>
            <option>ERROR</option>
            <option>WARN</option>
            <option>INFO</option>
          </select>
          <select className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
            <option>All Sources</option>
            <option>API</option>
            <option>Auth</option>
            <option>Payment</option>
            <option>Queue</option>
          </select>
          <select className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm">
            <option>All Tenants</option>
            <option>Doe Transport</option>
            <option>ABC Fleet</option>
            <option>XYZ Delivery</option>
          </select>
          <button className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Errors (Showing 1-50 of 847)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {mockErrors.map((error) => (
                <tr key={error.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {error.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      error.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                      error.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {error.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {error.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {error.tenant}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {error.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {error.count}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300">
            ← Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">Page 1 of 17</span>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300">
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
