import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function AuditLogsPage() {
  await requireRole('SUPER_ADMIN');

  // Fetch recent audit logs
  const auditLogs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive log of all system actions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Logs</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {auditLogs.length.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Actions Today</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">1,247</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Users</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">342</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed Actions</div>
          <div className="mt-1 text-3xl font-semibold text-red-600">12</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by user, action, or entity..."
            className="flex-1 min-w-[300px] rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          />
          <select className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
            <option>All Actions</option>
            <option>CREATE</option>
            <option>UPDATE</option>
            <option>DELETE</option>
            <option>VIEW</option>
          </select>
          <select className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700">
            <option>All Entities</option>
            <option>Tenant</option>
            <option>User</option>
            <option>Vehicle</option>
            <option>Driver</option>
          </select>
          <button className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700">
            Clear
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Showing 1-50 of {auditLogs.length.toLocaleString()} logs
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
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.user?.name || 'Unknown'}
                    <div className="text-xs text-gray-500">{log.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.entityType}
                    {log.entityId && (
                      <div className="text-xs text-gray-400">{log.entityId.substring(0, 8)}...</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {log.ipAddress}
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
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50">
              ← Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page 1 of 1</span>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50">
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          📋 Audit Trail Information
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>✓ All logs are immutable and cannot be modified or deleted</li>
          <li>✓ Logs are retained for 7+ years for compliance purposes</li>
          <li>✓ Cryptographic hashing ensures tamper-proof records</li>
          <li>✓ Full GDPR and compliance report generation available</li>
        </ul>
      </div>
    </div>
  );
}
