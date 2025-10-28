'use client';

import { useState, useEffect, useCallback } from 'react';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: string;
  source: string;
  tenant: string;
  message: string;
  count: number;
  stackTrace?: string;
}

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  warningErrors: number;
  errorRate: number;
}

interface ErrorLogsData {
  errors: ErrorLog[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: ErrorStats;
}

export function ErrorLogsManager() {
  const [data, setData] = useState<ErrorLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: '',
    source: '',
    tenant: '',
    timeRange: '24h'
  });
  const [page, setPage] = useState(1);

  const fetchErrorLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...filters
      });

      const response = await fetch(`/api/admin/error-logs?${params}`);
      if (response.ok) {
        const errorData = await response.json();
        setData(errorData);
      }
    } catch (error) {
      console.error('Error fetching error logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      level: '',
      source: '',
      tenant: '',
      timeRange: '24h'
    });
    setPage(1);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'WARN': return 'bg-yellow-100 text-yellow-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading error logs...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load error logs</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Error Logs
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor and troubleshoot system errors
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filters.timeRange}
            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={fetchErrorLogs}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Refresh
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
            Export Logs
          </button>
        </div>
      </div>

      {/* Error Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Errors</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {data.stats.totalErrors.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-red-600">↑ 12% from yesterday</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical</div>
          <div className="mt-1 text-3xl font-semibold text-red-600">
            {data.stats.criticalErrors}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Requires attention</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Warnings</div>
          <div className="mt-1 text-3xl font-semibold text-yellow-600">
            {data.stats.warningErrors}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Monitor closely</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {data.stats.errorRate}%
          </div>
          <div className="mt-1 text-xs text-green-600">↓ 0.1% from yesterday</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.level}
            onChange={(e) => handleFilterChange('level', e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            <option value="">All Levels</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
          </select>
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            <option value="">All Sources</option>
            <option value="API">API</option>
            <option value="Auth">Auth</option>
            <option value="Payment">Payment</option>
            <option value="Queue">Queue</option>
            <option value="System">System</option>
          </select>
          <select
            value={filters.tenant}
            onChange={(e) => handleFilterChange('tenant', e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
          >
            <option value="">All Tenants</option>
            <option value="Doe Transport">Doe Transport</option>
            <option value="ABC Fleet">ABC Fleet</option>
            <option value="XYZ Delivery">XYZ Delivery</option>
          </select>
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-700"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Errors (Showing {((page - 1) * 50) + 1}-{Math.min(page * 50, data.pagination.totalCount)} of {data.pagination.totalCount.toLocaleString()})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.errors.map((error) => (
                <tr key={error.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(error.level)}`}>
                      {error.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {error.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {error.tenant}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {error.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {error.count}x
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!data.pagination.hasPrevPage}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!data.pagination.hasNextPage}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}