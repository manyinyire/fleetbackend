"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCardIcon, ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

interface SubscriptionItem {
  id: string;
  tenantName: string;
  email: string;
  plan: string;
  status: string;
  isInTrial: boolean;
  trialEndsAt: string | null;
  subscriptionStart: string | null;
  nextBilling: string | null;
  autoRenew: boolean;
  monthlyRevenue: number;
  updatedAt: string;
}

interface SubscriptionResponse {
  success: boolean;
  data: {
    summary: {
      active: number;
      trial: number;
      expiringSoon: number;
      cancelled: number;
    };
    subscriptions: SubscriptionItem[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    active: 0,
    trial: 0,
    expiringSoon: 0,
    cancelled: 0,
  });
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    plan: "all",
  });

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await superAdminAPI.getSubscriptions({
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        plan: filters.plan !== "all" ? filters.plan : undefined,
        page: pagination.page,
        limit: pagination.limit,
      }) as SubscriptionResponse;

      if (response?.success && response.data) {
        setSummary(response.data.summary);
        setSubscriptions(response.data.subscriptions);
        setPagination((prev) => ({
          ...prev,
          ...response.data.pagination,
        }));
      } else {
        throw new Error("Invalid subscriptions payload");
      }
    } catch (err: any) {
      console.error("Error loading subscriptions:", err);
      setError(err.message || "Failed to load subscriptions");
      setSubscriptions([]);
      setSummary({
        active: 0,
        trial: 0,
        expiringSoon: 0,
        cancelled: 0,
      });
      setPagination((prev) => ({
        ...prev,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: event.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, status: event.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePlanChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, plan: event.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all tenant subscriptions</p>
        </div>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{summary.active.toLocaleString()}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trial</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{summary.trial.toLocaleString()}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{summary.expiringSoon.toLocaleString()}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{summary.cancelled.toLocaleString()}</p>
            </div>
            <CreditCardIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tenant or email"
              value={filters.search}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filters.plan}
              onChange={handlePlanChange}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Plans</option>
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
            </select>
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Subscriptions</h3>
        {subscriptions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Next Billing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trial Ends</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MRR</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{sub.tenantName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{sub.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{sub.plan}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {sub.isInTrial ? "Trial" : sub.status}
                      {sub.autoRenew ? (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">Auto-renew</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {sub.subscriptionStart ? new Date(sub.subscriptionStart).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                      ${sub.monthlyRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No subscriptions found</p>
        )}

        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} • {pagination.totalCount.toLocaleString()} results
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

