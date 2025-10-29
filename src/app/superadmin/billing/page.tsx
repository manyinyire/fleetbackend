"use client";

import { useState, useEffect } from "react";
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon
} from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

interface BillingData {
  summary: {
    totalRevenue: number;
    revenueChange: number;
    activeSubscriptions: number;
    subscriptionsChange: number;
    failedPayments: number;
    failedPaymentsChange: number;
    churnRate: number;
    churnRateChange: number;
  };
  planDistribution: {
    premium: number;
    basic: number;
    free: number;
    total: number;
  };
  revenueTrend: Array<{
    date: string;
    revenue: number;
    premiumTenants: number;
    basicTenants: number;
  }>;
}

const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const planColors = {
  FREE: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PREMIUM: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "transactions", name: "Transactions" },
    { id: "subscriptions", name: "Subscriptions" },
    { id: "failed-payments", name: "Failed Payments" }
  ];

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await superAdminAPI.getBillingOverview('30');

      if (response.success) {
        setBillingData(response.data);
      }
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "text-gray-900 dark:text-white"
  }: {
    title: string;
    value: string | number;
    change: number;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
          <div className="flex items-center mt-2">
            {change > 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}% {change > 0 ? '↑' : '↓'}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Error loading billing data
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-6">
          <button
            onClick={loadBillingData}
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
            Financial Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor revenue, subscriptions, and payment processing
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
            Generate Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && billingData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue (MRR)"
              value={`$${billingData.summary.totalRevenue.toLocaleString()}`}
              change={billingData.summary.revenueChange}
              icon={CurrencyDollarIcon}
            />
            <StatCard
              title="Active Subscriptions"
              value={billingData.summary.activeSubscriptions.toLocaleString()}
              change={billingData.summary.subscriptionsChange}
              icon={ChartBarIcon}
            />
            <StatCard
              title="Failed Payments"
              value={billingData.summary.failedPayments}
              change={billingData.summary.failedPaymentsChange}
              icon={ExclamationTriangleIcon}
              color="text-red-600 dark:text-red-400"
            />
            <StatCard
              title="Churn Rate"
              value={`${billingData.summary.churnRate}%`}
              change={billingData.summary.churnRateChange}
              icon={ChartBarIcon}
              color="text-green-600 dark:text-green-400"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue Trend
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                [Chart Placeholder - Revenue Trend]
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Plan Distribution
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Premium</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {billingData.planDistribution.premium}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Basic</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {billingData.planDistribution.basic}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {billingData.planDistribution.free}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs - placeholder content */}
      {activeTab === "transactions" && (
        <div className="text-center py-12">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Transactions
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Transaction management coming soon.
          </p>
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Subscriptions
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Subscription management coming soon.
          </p>
        </div>
      )}

      {activeTab === "failed-payments" && (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Failed Payments
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Failed payment management coming soon.
          </p>
        </div>
      )}
    </div>
  );
}