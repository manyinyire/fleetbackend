'use client';

import { useState } from 'react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Mock data - would be fetched from API
const userGrowthData = [
  { month: 'Jan', users: 120 },
  { month: 'Feb', users: 145 },
  { month: 'Mar', users: 168 },
  { month: 'Apr', users: 189 },
  { month: 'May', users: 210 },
  { month: 'Jun', users: 234 }
];

const tenantActivity = [
  { tenant: 'Company A', activeDrivers: 45, totalDrivers: 50, vehicles: 12 },
  { tenant: 'Company B', activeDrivers: 30, totalDrivers: 35, vehicles: 8 },
  { tenant: 'Company C', activeDrivers: 25, totalDrivers: 30, vehicles: 7 },
  { tenant: 'Company D', activeDrivers: 20, totalDrivers: 25, vehicles: 5 }
];

const featureUsage = [
  { name: 'Fleet Management', usage: 85, color: '#3b82f6' },
  { name: 'Driver Management', usage: 92, color: '#10b981' },
  { name: 'Financial Reports', usage: 68, color: '#f59e0b' },
  { name: 'Notifications', usage: 76, color: '#ef4444' }
];

const timeOfDayUsage = [
  { hour: '6:00', logins: 12 },
  { hour: '7:00', logins: 45 },
  { hour: '8:00', logins: 89 },
  { hour: '9:00', logins: 120 },
  { hour: '10:00', logins: 95 },
  { hour: '11:00', logins: 78 },
  { hour: '12:00', logins: 65 }
];

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
              <p className="text-sm text-green-600 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +12%
              </p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">42</p>
              <p className="text-sm text-green-600 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +8%
              </p>
            </div>
            <BuildingOfficeIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">456</p>
              <p className="text-sm text-red-600 flex items-center">
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                -3%
              </p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">23min</p>
              <p className="text-sm text-green-600 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +5%
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Usage Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={featureUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.usage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="usage"
              >
                {featureUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tenant Activity Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tenant Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tenantActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tenant" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="activeDrivers" fill="#3b82f6" />
              <Bar dataKey="totalDrivers" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time of Day Usage */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Login Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeOfDayUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="logins" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Export Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download analytics data for selected time period
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Export CSV
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
