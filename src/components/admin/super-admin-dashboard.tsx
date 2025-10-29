'use client';

import { useState, useEffect } from 'react';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  BellIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  kpis: {
    totalTenants: number;
    activeUsers: number;
    mrr: number;
    arr: number;
    churnRate: number;
    newMrr: number;
    arpu: number;
    ltv: number;
  };
  recentSignups: any[];
  paymentFailures: any[];
  supportTickets: any[];
  systemAlerts: any[];
  revenueTrendData: any[];
  tenantGrowthData: any[];
}

interface SuperAdminDashboardProps {
  data: DashboardData;
}

export function SuperAdminDashboard({ data }: SuperAdminDashboardProps) {
  const [isLiveFeedActive, setIsLiveFeedActive] = useState(true);
  const [liveActivities, setLiveActivities] = useState([
    { id: 1, type: 'account', message: 'New tenant signup: "Masvingo Cabs"', timestamp: '2s ago', icon: '🟢' },
    { id: 2, type: 'payment', message: 'Payment processed: ABC Transport ($45.00)', timestamp: '5s ago', icon: '🔵' },
    { id: 3, type: 'support', message: 'Support ticket opened: #2848', timestamp: '12s ago', icon: '🟡' },
    { id: 4, type: 'user', message: 'User login: john@doetransport.co.zw', timestamp: '15s ago', icon: '🔵' },
    { id: 5, type: 'account', message: 'Remittance approved: Vehicle ABC-1234', timestamp: '28s ago', icon: '🟢' },
    { id: 6, type: 'system', message: 'Report generated: Financial Summary', timestamp: '45s ago', icon: '🔵' }
  ]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'SUCCESS': return 'text-green-600 bg-green-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CRITICAL': return '🔴';
      case 'WARNING': return '🟡';
      case 'SUCCESS': return '🟢';
      case 'INFO': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Platform overview and system health monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 3 Months</option>
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tenants */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Tenants
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(data.kpis.totalTenants)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Free:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {Math.floor(data.kpis.totalTenants * 0.43)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">Basic:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {Math.floor(data.kpis.totalTenants * 0.35)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">Premium:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {Math.floor(data.kpis.totalTenants * 0.22)}
              </span>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Users (30d)
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatNumber(data.kpis.activeUsers)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      8%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Daily:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {Math.floor(data.kpis.activeUsers * 0.38)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">Weekly:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {Math.floor(data.kpis.activeUsers * 0.70)}
              </span>
            </div>
          </div>
        </div>

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
                      {formatCurrency(data.kpis.mrr)}
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
                {formatCurrency(data.kpis.arr)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">ARPU:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {formatCurrency(data.kpis.arpu)}
              </span>
            </div>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Churn Rate (Monthly)
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {data.kpis.churnRate}%
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                      <span className="sr-only">Decreased by</span>
                      0.5%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">Voluntary:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {Math.floor(data.kpis.churnRate * 0.78)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">Reactivated:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Revenue Trend (Last 6 Months)
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

        {/* Tenant Growth Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Tenant Growth
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
              <AreaChart data={data.tenantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="free" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  name="Free"
                />
                <Area 
                  type="monotone" 
                  dataKey="basic" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  name="Basic"
                />
                <Area 
                  type="monotone" 
                  dataKey="premium" 
                  stackId="1" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  name="Premium"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              System Alerts
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {data.systemAlerts.filter(alert => !alert.acknowledged).length}
            </span>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.systemAlerts.map((alert) => (
            <div key={alert.id} className="px-6 py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-lg">{getStatusIcon(alert.type)}</span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${getStatusColor(alert.type).split(' ')[0]}`}>
                      {alert.type} - {alert.title}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                      {!alert.acknowledged && (
                        <button className="text-xs text-indigo-600 hover:text-indigo-500">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {alert.message}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <button className="text-xs text-indigo-600 hover:text-indigo-500">
                      View Details
                    </button>
                    {alert.type === 'CRITICAL' && (
                      <button className="text-xs text-red-600 hover:text-red-500">
                        Create Ticket
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signups */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recent Signups
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {data.recentSignups.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.recentSignups.map((signup) => (
              <div key={signup.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {signup.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {signup.plan} Plan
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(signup.createdAt).toLocaleDateString()}
                    </span>
                    <button className="text-xs text-indigo-600 hover:text-indigo-500">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
              <button className="text-sm text-indigo-600 hover:text-indigo-500">
                View All Signups →
              </button>
            </div>
          </div>
        </div>

        {/* Payment Failures */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Payment Failures
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {data.paymentFailures.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.paymentFailures.map((failure) => (
              <div key={failure.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {failure.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Card declined
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(failure.suspendedAt).toLocaleDateString()}
                    </span>
                    <button className="text-xs text-indigo-600 hover:text-indigo-500">
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
              <button className="text-sm text-indigo-600 hover:text-indigo-500">
                View All Failures →
              </button>
            </div>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Open Support Tickets
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                12
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    #2847 - Login issues
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Priority: HIGH • Assigned: Sarah K.
                  </p>
                </div>
                <button className="text-xs text-indigo-600 hover:text-indigo-500">
                  View
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    #2846 - Invoice error
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Priority: MEDIUM • Assigned: John D.
                  </p>
                </div>
                <button className="text-xs text-indigo-600 hover:text-indigo-500">
                  View
                </button>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
              <button className="text-sm text-indigo-600 hover:text-indigo-500">
                View All Tickets →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Live Activity Feed
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  isLiveFeedActive 
                    ? 'text-red-600 bg-red-100' 
                    : 'text-green-600 bg-green-100'
                }`}
              >
                {isLiveFeedActive ? 'Pause' : 'Resume'}
              </button>
              <div className={`w-2 h-2 rounded-full ${isLiveFeedActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-3">
            {liveActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <span className="text-sm">{activity.icon}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.timestamp} - {activity.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
