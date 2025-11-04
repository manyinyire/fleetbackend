"use client";

import { useState, useEffect } from "react";
import { ChartBarIcon, UserGroupIcon, ArrowTrendingUpIcon, EyeIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pageViews: 0,
    uniqueUsers: 0,
    signups: 0,
    conversionRate: 0
  });

  useEffect(() => {
    // TODO: Implement analytics API
    setLoading(false);
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Platform-wide analytics and metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Page Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.pageViews.toLocaleString()}</p>
            </div>
            <EyeIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.uniqueUsers.toLocaleString()}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Signups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.signups.toLocaleString()}</p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.conversionRate.toFixed(2)}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Sources</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Chart placeholder - Traffic sources analysis
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Signup Funnel</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Landing Page</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">42,891 visitors</span>
          </div>
          <div className="flex items-center justify-center text-gray-400">↓ 12%</div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Pricing Page</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">5,147 visitors</span>
          </div>
          <div className="flex items-center justify-center text-gray-400">↓ 8%</div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Signup Page</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">412 visitors</span>
          </div>
          <div className="flex items-center justify-center text-gray-400">↓ 60%</div>
          <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Completed</span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">247 signups</span>
          </div>
        </div>
      </div>
    </div>
  );
}

