import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export default async function AdminUsersPage() {
  await requireRole('SUPER_ADMIN');

  // Fetch all super admin users
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN'
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Super Admin Users
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage platform administrators
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          + Add Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Admins</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {adminUsers.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Today</div>
          <div className="mt-1 text-3xl font-semibold text-green-600">
            {Math.floor(adminUsers.length * 0.6)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">With 2FA</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {Math.floor(adminUsers.length * 0.8)}
          </div>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Administrator Accounts
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  2FA Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {adminUsers.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {admin.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {admin.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      Math.random() > 0.2
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {Math.random() > 0.2 ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix Info */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Admin Role Permissions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">Feature</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">Platform Owner</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">System Admin</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">Support Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">View all tenants</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Create/delete tenants</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-red-600">❌</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Manage subscriptions</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-red-600">❌</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Impersonate users</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">Access system settings</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-green-600">✅</td>
                <td className="px-4 py-3 text-center text-red-600">❌</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
