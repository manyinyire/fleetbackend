"use client";

import { useState, useEffect } from "react";
import { ChartBarSquareIcon, ClockIcon, ExclamationTriangleIcon, ServerIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    requestVolume: 0
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      // TODO: Implement performance metrics API
      setMetrics({
        avgResponseTime: 142,
        p95ResponseTime: 245,
        p99ResponseTime: 512,
        errorRate: 0.12,
        requestVolume: 125000
      });
    } catch (err) {
      console.error("Error loading metrics:", err);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor API performance and response times</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{metrics.avgResponseTime}ms</p>
            </div>
            <ClockIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">P95 Response</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{metrics.p95ResponseTime}ms</p>
            </div>
            <ChartBarSquareIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">P99 Response</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{metrics.p99ResponseTime}ms</p>
            </div>
            <ServerIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{metrics.errorRate}%</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Requests/min</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{metrics.requestVolume.toLocaleString()}</p>
            </div>
            <ChartBarSquareIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Response Times (Last 24h)</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chart placeholder - Response times
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Volume</h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chart placeholder - Request volume
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slowest Queries</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Query</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Calls</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">SELECT * FROM tenants...</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">245ms</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">1,234</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

