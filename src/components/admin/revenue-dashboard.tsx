'use client';

import { useState } from 'react';
import { 
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  metrics: {
    mrr: number;
    arr: number;
    newMrr: number;
    churnedMrr: number;
    netMrrGrowth: number;
    arpu: number;
    ltv: number;
  };
  planRevenueData: any[];
  topRevenueTenants: any[];
  failedPayments: any[];
  revenueTrendData: any[];
  cohortData: any[];
}

interface RevenueDashboardProps {
  data: RevenueData;
}

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

export function RevenueDashboard({ data }: RevenueDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('12m');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return '#6B7280';
      case 'BASIC': return '#3B82F6';
      case 'PREMIUM': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revenue Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive financial analytics and revenue tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* MRR */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Monthly Revenue (MRR)
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(data.metrics.mrr)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      15%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">ARR:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {formatCurrency(data.metrics.arr)}
              </span>
            </div>
          </div>
        </div>

        {/* ARR */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Annual Revenue (ARR)
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(data.metrics.arr)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      18%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Growth Rate:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                +18% YoY
              </span>
            </div>
          </div>
        </div>

        {/* New MRR */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    New MRR
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(data.metrics.newMrr)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      22%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">This Month:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {formatCurrency(data.metrics.newMrr)}
              </span>
            </div>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowDownIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Churned MRR
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(data.metrics.churnedMrr)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                      <span className="sr-only">Decreased by</span>
                      2.3%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Churn Rate:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                2.3%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              MRR Trend
            </h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
                CSV
              </button>
              <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                PNG
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Actual Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Revenue by Plan
            </h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
                CSV
              </button>
              <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                PNG
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.planRevenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, revenue }) => `${plan}: ${formatCurrency(Number(revenue))}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.planRevenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPlanColor(entry.plan)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Revenue Tenants */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Top Revenue Tenants
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.topRevenueTenants.map((tenant, index) => (
            <div key={tenant.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-lg font-bold text-gray-500">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {tenant.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tenant.plan} Plan • {tenant._count.users} users
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(Number(tenant.monthlyRevenue))}/mo
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tenant.plan === 'PREMIUM' && '3x add-ons'}
                    </div>
                  </div>
                  <button className="text-xs text-indigo-600 hover:text-indigo-500">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Failed Payments */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Failed Payments
            </h3>
            <button className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
              Retry Selected
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.failedPayments.length > 0 ? (
            data.failedPayments.map((payment) => (
              <div key={payment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Card declined • Last attempt: {new Date(payment.suspendedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(Number(payment.monthlyRevenue))}
                    </span>
                    <div className="flex space-x-1">
                      <button className="text-xs text-indigo-600 hover:text-indigo-500">
                        Retry
                      </button>
                      <button className="text-xs text-gray-600 hover:text-gray-500">
                        Contact
                      </button>
                      <button className="text-xs text-red-600 hover:text-red-500">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No Failed Payments
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All payments are processing successfully.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Analysis */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Cohort Retention Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cohort
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month 0
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month 3
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Month 4
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.cohortData.map((cohort) => (
                <tr key={cohort.month}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {cohort.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cohort.retention}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cohort.month1}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cohort.month2}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cohort.month3}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {cohort.month4}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
