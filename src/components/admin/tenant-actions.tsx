'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface TenantActionsProps {
  tenant: {
    id: string;
    name: string;
    email: string;
    plan: string;
    status: string;
    phone?: string | null;
  };
}

export function TenantActions({ tenant }: TenantActionsProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone || ''
  });

  // Upgrade form state
  const [selectedPlan, setSelectedPlan] = useState(tenant.plan);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        toast.success('Tenant updated successfully');
        setShowEditModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update tenant');
      }
    } catch (error) {
      toast.error('Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan })
      });

      if (response.ok) {
        toast.success(`Plan changed to ${selectedPlan} successfully`);
        setShowUpgradeModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to change plan');
      }
    } catch (error) {
      toast.error('Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    setLoading(true);

    try {
      const newStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      const response = await fetch(`/api/admin/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Tenant ${newStatus.toLowerCase()} successfully`);
        setShowSuspendModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
        >
          View
        </button>
        <button
          onClick={() => setShowEditModal(true)}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
        >
          Edit
        </button>
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
        >
          Change Plan
        </button>
        <button
          onClick={() => setShowSuspendModal(true)}
          className={`text-sm ${
            tenant.status === 'SUSPENDED'
              ? 'text-green-600 hover:text-green-900 dark:text-green-400'
              : 'text-red-600 hover:text-red-900 dark:text-red-400'
          }`}
        >
          {tenant.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Tenant</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade/Change Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Subscription Plan</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpgrade} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Plan: <span className="font-medium">{tenant.plan}</span>
              </p>
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="plan"
                    value="FREE"
                    checked={selectedPlan === 'FREE'}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Free Plan</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">$0/month • Basic features</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="plan"
                    value="BASIC"
                    checked={selectedPlan === 'BASIC'}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Basic Plan</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">$15/month • Standard features</div>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="plan"
                    value="PREMIUM"
                    checked={selectedPlan === 'PREMIUM'}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">Premium Plan</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">$45/month • All features</div>
                  </div>
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedPlan === tenant.plan}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Change Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend/Activate Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {tenant.status === 'SUSPENDED' ? 'Activate' : 'Suspend'} Tenant
              </h3>
              <button
                onClick={() => setShowSuspendModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tenant.status === 'SUSPENDED' ? (
                  <>Are you sure you want to activate <span className="font-medium">{tenant.name}</span>? They will regain access to their account.</>
                ) : (
                  <>Are you sure you want to suspend <span className="font-medium">{tenant.name}</span>? They will lose access to their account immediately.</>
                )}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-sm text-white disabled:opacity-50 ${
                  tenant.status === 'SUSPENDED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading ? 'Processing...' : (tenant.status === 'SUSPENDED' ? 'Activate' : 'Suspend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
