'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  metrics: {
    avgResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    uptime: number;
    activeConnections: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
  slowestEndpoints: Array<{
    endpoint: string;
    avgTime: number;
    calls: number;
    status: string;
  }>;
  hourlyMetrics: Array<{
    hour: string;
    requests: number;
    avgTime: number;
    errors: number;
  }>;
  databaseMetrics: {
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
    queryPerformance: {
      avgQueryTime: number;
      slowQueries: number;
      totalQueries: number;
    };
  };
}

export function PerformanceMonitor() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/performance?timeRange=${timeRange}`);
      if (response.ok) {
        const performanceData = await response.json();
        setData(performanceData);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchPerformanceData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh, fetchPerformanceData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'needs_optimization': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-green-100 text-green-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading performance data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load performance data</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Performance Monitoring
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor application performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {autoRefresh ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Response Time</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {data.metrics.avgResponseTime}ms
          </div>
          <div className="mt-1 text-xs text-green-600">↓ 12% from last hour</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Requests/min</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {data.metrics.requestsPerMinute.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-green-600">↑ 8% from last hour</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Rate</div>
          <div className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
            {data.metrics.errorRate}%
          </div>
          <div className="mt-1 text-xs text-green-600">↓ 0.1% from last hour</div>
        </div>
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</div>
          <div className="mt-1 text-3xl font-semibold text-green-600">
            {data.metrics.uptime}%
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Last 30 days</div>
        </div>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Resources</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.metrics.cpuUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${data.metrics.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.metrics.memoryUsage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${data.metrics.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Connections</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.metrics.activeConnections}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Database Pool</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Connections</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.databaseMetrics.connectionPool.active}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Idle Connections</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.databaseMetrics.connectionPool.idle}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Pool Size</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.databaseMetrics.connectionPool.total}</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Query Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.databaseMetrics.queryPerformance.avgQueryTime}ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Response Time Percentiles</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">p50 (median)</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.responseTimePercentiles.p50}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">p95</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.responseTimePercentiles.p95}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">p99</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{data.responseTimePercentiles.p99}ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Request Volume & Response Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.hourlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name="Requests" />
              <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#10b981" strokeWidth={2} name="Avg Time (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Error Rate Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hourlyMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="errors" fill="#ef4444" name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Slowest Endpoints */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Slowest Endpoints
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Calls (24h)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.slowestEndpoints.map((endpoint, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                    {endpoint.endpoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {endpoint.avgTime}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {endpoint.calls.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(endpoint.status)}`}>
                      {endpoint.status.replace('_', ' ')}
                    </span>
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