"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilIcon,
  UserGroupIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  mrr: number;
  createdAt: string;
  updatedAt: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  autoRenew: boolean;
  users?: any[];
  vehicles?: any[];
  drivers?: any[];
  invoices?: any[];
  recentActivity?: any[];
  userCount?: number;
  vehicleCount?: number;
  driverCount?: number;
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  TRIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
};

const planColors = {
  FREE: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PREMIUM: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
};

export default function TenantDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "",
    status: ""
  });

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminAPI.getTenant(tenantId) as { success: boolean; data?: any };
      if (response.success && response.data) {
        setTenant(response.data);
        setEditForm({
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          plan: response.data.plan || "FREE",
          status: response.data.status || "ACTIVE"
        });
      } else {
        setError("Failed to load tenant");
      }
    } catch (err) {
      console.error("Error loading tenant:", err);
      setError("Failed to load tenant");
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    const reason = prompt(`Enter reason for impersonating ${tenant?.name} (minimum 10 characters):`);
    if (!reason || reason.trim().length < 10) {
      alert("Detailed reason is required (minimum 10 characters)");
      return;
    }

    if (!confirm(`Are you sure you want to impersonate ${tenant?.name}?`)) {
      return;
    }

    try {
      const response = await superAdminAPI.impersonateTenant(tenantId, reason) as { success: boolean; data?: { sessionToken?: string; redirectUrl?: string; message?: string }; error?: string };
      if (response.success && response.data) {
        // Store impersonation flag
        sessionStorage.setItem('impersonating', 'true');
        sessionStorage.setItem('impersonation_message', response.data.message || 'Impersonating tenant');
        
        // Redirect to tenant dashboard
        window.location.href = response.data.redirectUrl || '/dashboard';
      } else {
        alert(response.error || "Failed to start impersonation");
      }
    } catch (err: any) {
      console.error("Impersonation error:", err);
      alert(err.message || "Failed to start impersonation");
    }
  };

  const handleSuspend = async () => {
    if (!confirm(`Are you sure you want to suspend ${tenant?.name}?`)) {
      return;
    }
    try {
      await superAdminAPI.updateTenant(tenantId, { status: "SUSPENDED" });
      loadTenant();
    } catch (err) {
      alert("Failed to suspend tenant");
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel ${tenant?.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await superAdminAPI.updateTenant(tenantId, { status: "CANCELED" });
      loadTenant();
    } catch (err) {
      alert("Failed to cancel tenant");
    }
  };

  const handleActivate = async () => {
    if (!confirm(`Are you sure you want to activate ${tenant?.name}?`)) {
      return;
    }
    try {
      await superAdminAPI.updateTenant(tenantId, { status: "ACTIVE" });
      loadTenant();
    } catch (err) {
      alert("Failed to activate tenant");
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await superAdminAPI.updateTenant(tenantId, editForm) as { success: boolean; error?: string };
      if (response.success) {
        alert("Tenant updated successfully");
        setEditing(false);
        loadTenant();
      } else {
        alert(response.error || "Failed to update tenant");
      }
    } catch (err: any) {
      console.error("Error updating tenant:", err);
      alert(err.message || "Failed to update tenant");
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (tenant) {
      setEditForm({
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone || "",
        plan: tenant.plan,
        status: tenant.status
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {error || "Tenant not found"}
        </h3>
        <div className="mt-6">
          <Link
            href="/superadmin/tenants"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Tenants
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: BuildingOfficeIcon },
    { id: "users", name: "Users", icon: UserGroupIcon },
    { id: "vehicles", name: "Vehicles", icon: TruckIcon },
    { id: "billing", name: "Billing", icon: CurrencyDollarIcon },
    { id: "activity", name: "Activity", icon: ClockIcon },
    { id: "settings", name: "Settings", icon: Cog6ToothIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/superadmin/tenants"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Tenants
          </Link>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleImpersonate}
            className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Impersonate
          </button>
          {tenant?.status === "SUSPENDED" && (
            <button
              onClick={handleActivate}
              className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Activate
            </button>
          )}
          {tenant?.status === "ACTIVE" && (
            <button
              onClick={handleSuspend}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
            >
              <XCircleIcon className="h-4 w-4 mr-2" />
              Suspend
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-indigo-200 dark:border-indigo-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Tenant Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plan</label>
              <select
                value={editForm.plan}
                onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="FREE">Free</option>
                <option value="BASIC">Basic</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Tenant Info Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tenant ID: {tenant.id}</p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                {tenant.email}
              </div>
              {tenant.phone && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {tenant.phone}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Created: {new Date(tenant.createdAt).toLocaleDateString()}
              </div>
            </div>
            {/* Subscription Period */}
            {(tenant.subscriptionStartDate || tenant.subscriptionEndDate) && (
              <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">Subscription Period</p>
                    <div className="flex items-center space-x-4 mt-1">
                      {tenant.subscriptionStartDate && (
                        <div className="text-sm text-indigo-700 dark:text-indigo-400">
                          <span className="font-medium">Start:</span> {new Date(tenant.subscriptionStartDate).toLocaleDateString()}
                        </div>
                      )}
                      {tenant.subscriptionEndDate && (
                        <div className="text-sm text-indigo-700 dark:text-indigo-400">
                          <span className="font-medium">End:</span> {new Date(tenant.subscriptionEndDate).toLocaleDateString()}
                        </div>
                      )}
                      {tenant.subscriptionEndDate && (
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">
                          ({Math.ceil((new Date(tenant.subscriptionEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining)
                        </div>
                      )}
                    </div>
                  </div>
                  {tenant.autoRenew && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      Auto-renew enabled
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[tenant.status as keyof typeof statusColors]}`}>
              {tenant.status}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${planColors[tenant.plan as keyof typeof planColors]}`}>
              {tenant.plan}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.userCount || tenant.users?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vehicles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.vehicleCount || tenant.vehicles?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">MRR</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${tenant.mrr.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drivers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.driverCount || tenant.drivers?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{tenant.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{tenant.email}</dd>
                </div>
                {tenant.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{tenant.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[tenant.status as keyof typeof statusColors]}`}>
                      {tenant.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Details</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${planColors[tenant.plan as keyof typeof planColors]}`}>
                      {tenant.plan} (${tenant.mrr}/month)
                    </span>
                  </dd>
                </div>
                {tenant.subscriptionStartDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription Start</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(tenant.subscriptionStartDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {tenant.subscriptionEndDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subscription End</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(tenant.subscriptionEndDate).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto Renew</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {tenant.autoRenew ? (
                      <span className="text-green-600 dark:text-green-400">Enabled</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">Disabled</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage Statistics</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Users</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {tenant.userCount || tenant.users?.length || 0} active
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicles</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {tenant.vehicleCount || tenant.vehicles?.length || 0} registered
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Drivers</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {tenant.driverCount || tenant.drivers?.length || 0} active
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Revenue</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">${tenant.mrr.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Users in Tenant</h3>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
                Add User
              </button>
            </div>
            {tenant.users && tenant.users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tenant.users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No users found</p>
            )}
          </div>
        )}

        {activeTab === "vehicles" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicles</h3>
            {tenant.vehicles && tenant.vehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Registration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Make/Model</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tenant.vehicles.map((vehicle: any) => (
                      <tr key={vehicle.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {vehicle.registrationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {vehicle.make} {vehicle.model}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{vehicle.year}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No vehicles found</p>
            )}
          </div>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                {tenant.invoices && tenant.invoices.length > 0 && tenant.invoices[0]?.paymentMethod ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCardIcon className="h-6 w-6 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {tenant.invoices[0].paymentMethod === 'PAYNOW' ? 'PayNow' : 
                           tenant.invoices[0].paymentMethod === 'CARD' ? 'Credit/Debit Card' : 
                           tenant.invoices[0].paymentMethod}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last used: {new Date(tenant.invoices[0].paidAt || tenant.invoices[0].createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CreditCardIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No payment method on file</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Payment method will be recorded after first payment</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Next Charge</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {tenant.subscriptionEndDate
                        ? new Date(tenant.subscriptionEndDate).toLocaleDateString()
                        : "Not scheduled"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">${tenant.mrr.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice History</h3>
              {tenant.invoices && tenant.invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {tenant.invoices.map((invoice: any) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${invoice.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No invoices found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h3>
            {tenant.recentActivity && tenant.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {tenant.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {activity.user?.name || "System"} • {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Status</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Current Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${statusColors[tenant.status as keyof typeof statusColors]}`}>
                      {tenant.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {tenant.status !== "SUSPENDED" && (
                      <button
                        onClick={handleSuspend}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                      >
                        Suspend Account
                      </button>
                    )}
                    {tenant.status !== "CANCELED" && (
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Management</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${planColors[tenant.plan as keyof typeof planColors]}`}>
                        {tenant.plan}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-end">
                    <button className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400">
                      Change Plan
                    </button>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

