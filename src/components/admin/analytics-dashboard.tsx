'use client';

import { useState, useEffect } from 'react';
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

interface AnalyticsData {
  metrics: {
    totalUsers: number;
    totalTenants: number;
    activeUsers: number;
    newUsers: number;
    newTenants: number;
    userGrowthRate: number;
    tenantGrowthRate: number;
    avgSessionTime: number;
  };
  charts: {
    userGrowth: Array<{ month: string; users: number }>;
    tenantActivity: Array<{ tenant: string; activeDrivers: number; totalDrivers: number; vehicles: number }>;
    featureUsage: Array<{ name: string; usage: number; color: string }>;
    timeOfDayUsage: Array<{ hour: string; logins: number }>;
  };
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading analytics data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.metrics.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +{data.metrics.userGrowthRate.toFixed(1)}%
              </p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.metrics.totalTenants}</p>
              <p className="text-sm text-green-600 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +{data.metrics.tenantGrowthRate.toFixed(1)}%
              </p>
            </div>
            <BuildingOfficeIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.metrics.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 flex items-center">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                +{data.metrics.newUsers}
              </p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.metrics.avgSessionTime}min</p>
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
            <LineChart data={data.charts.userGrowth}>
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
                data={data.charts.featureUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.usage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="usage"
              >
                {data.charts.featureUsage.map((entry, index) => (
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
            <BarChart data={data.charts.tenantActivity}>
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
            <LineChart data={data.charts.timeOfDayUsage}>
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
            <button 
              onClick={() => fetchAnalyticsData()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Refresh Data
            </button>
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