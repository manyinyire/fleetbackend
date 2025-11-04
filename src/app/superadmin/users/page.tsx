"use client";

import { useState, useEffect } from "react";
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
  tenant?: {
    id: string;
    name: string;
  };
  lastLoginAt?: string;
  createdAt: string;
  image?: string;
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  TENANT_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  FLEET_MANAGER: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  ACCOUNTANT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  DRIVER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  USER: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
};

const getStatusColor = (lastLogin?: string) => {
  if (!lastLogin) return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  const lastLoginDate = new Date(lastLogin);
  const daysSinceLogin = (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLogin < 7) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  if (daysSinceLogin < 30) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
};

const getStatusIcon = (lastLogin?: string) => {
  if (!lastLogin) return ClockIcon;
  const lastLoginDate = new Date(lastLogin);
  const daysSinceLogin = (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceLogin < 7) return CheckCircleIcon;
  if (daysSinceLogin < 30) return ClockIcon;
  return XCircleIcon;
};

const formatLastLogin = (lastLogin?: string) => {
  if (!lastLogin) return "Never";
  const date = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    superAdmins: 0,
    suspended: 0
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [searchTerm, selectedRole, selectedTenant, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await superAdminAPI.getUsers({
        search: searchTerm,
        role: selectedRole !== 'all' ? selectedRole : undefined,
        page,
        limit: 25
      });

      if (response.success) {
        setUsers(response.data.users || []);
        setStats(response.data.stats || {
          total: response.data.pagination?.total || 0,
          active: 0,
          superAdmins: 0,
          suspended: 0
        });
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await superAdminAPI.deleteUser(userId);
      if (response.success) {
        loadUsers();
        alert('User deleted successfully');
      } else {
        alert(response.error || 'Failed to delete user');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Enter ban reason (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      const response = await superAdminAPI.banUser(userId, reason || undefined);
      if (response.success) {
        loadUsers();
        alert('User banned successfully');
      } else {
        alert(response.error || 'Failed to ban user');
      }
    } catch (err: any) {
      console.error('Error banning user:', err);
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unban this user?')) {
      return;
    }
    try {
      const response = await superAdminAPI.unbanUser(userId);
      if (response.success) {
        loadUsers();
        alert('User unbanned successfully');
      } else {
        alert(response.error || 'Failed to unban user');
      }
    } catch (err: any) {
      console.error('Error unbanning user:', err);
      alert('Failed to unban user');
    }
  };

  const handleChangeRole = async (userId: string) => {
    const newRole = prompt('Enter new role (SUPER_ADMIN, TENANT_ADMIN, FLEET_MANAGER, ACCOUNTANT, DRIVER, USER):');
    if (!newRole) return;
    
    try {
      const response = await superAdminAPI.setUserRole(userId, newRole);
      if (response.success) {
        loadUsers();
        alert('User role updated successfully');
      } else {
        alert(response.error || 'Failed to update user role');
      }
    } catch (err: any) {
      console.error('Error updating role:', err);
      alert('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTenant = selectedTenant === "all" || user.tenant?.id === selectedTenant;
    
    return matchesSearch && matchesTenant;
  });

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Error loading users
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-6">
          <button
            onClick={loadUsers}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all platform users across all tenants
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
          <PlusIcon className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users, emails, or tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="lg:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="FLEET_MANAGER">Fleet Manager</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="DRIVER">Driver</option>
              <option value="USER">User</option>
            </select>
          </div>

          {/* Advanced Filters */}
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.superAdmins}</p>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.suspended}</p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
              {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Change Role
              </button>
              <button className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Suspend
              </button>
              <button className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Send Email
              </button>
              <button className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                Export
              </button>
              <button className="text-sm text-red-600 hover:text-red-500 dark:text-red-400">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => {
                const StatusIcon = getStatusIcon(user.lastLoginAt);
                const statusColor = getStatusColor(user.lastLoginAt);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.image ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.image}
                              alt={user.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.tenant?.name || "No tenant"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || roleColors.USER}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                        {user.banned && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Banned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className="h-4 w-4 mr-2" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                          {user.banned ? 'Banned' : user.lastLoginAt ? (getStatusColor(user.lastLoginAt).includes('green') ? 'Active' : 'Inactive') : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatLastLogin(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => window.location.href = `/superadmin/users/${user.id}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                          title="View user"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleChangeRole(user.id)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                          title="Change role"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {user.banned ? (
                          <button 
                            onClick={() => handleUnbanUser(user.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                            title="Unban user"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleBanUser(user.id)}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
                            title="Ban user"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400"
                          title="Delete user"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(page - 1) * 25 + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * 25, stats.total)}</span> of{' '}
                  <span className="font-medium">{stats.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
