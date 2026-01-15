'use client';

import { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SystemHealthData {
  healthScore: number;
  alerts: {
    critical: number;
    warning: number;
    info: number;
    success: number;
  };
  systemAlerts: any[];
  recentIncidents: any[];
  serverStatus: any[];
  metrics: {
    apiUptime: number;
    dbStatus: string;
    avgResponseTime: number;
    errorRate: number;
    requestVolume: number;
  };
  metricsData: Record<string, any[]>;
}

interface SystemHealthDashboardProps {
  data: SystemHealthData;
}

export function SystemHealthDashboard({ data }: SystemHealthDashboardProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [systemData, setSystemData] = useState(data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const fetchSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemData(data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Health</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Real-time monitoring of platform infrastructure and performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Auto-refresh:</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                autoRefresh 
                  ? 'text-green-600 bg-green-100' 
                  : 'text-gray-600 bg-gray-100'
              }`}
            >
              {autoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
          <select 
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API Uptime */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <SignalIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    API Uptime
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {systemData.metrics.apiUptime}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm text-green-600 font-medium">
              🟢 All Systems Operational
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CircleStackIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Database Status
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {systemData.metrics.dbStatus}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm text-green-600 font-medium">
              🟢 Normal Operations
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Avg Response Time
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {systemData.metrics.avgResponseTime}ms
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm text-green-600 font-medium">
              🟢 Within Normal Range
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Error Rate
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {systemData.metrics.errorRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
            <div className="text-sm text-green-600 font-medium">
              🟢 Low Error Rate
            </div>
          </div>
        </div>
      </div>

      {/* System Health Score */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            System Health Score
          </h3>
          <span className={`text-3xl font-bold ${getHealthScoreColor(systemData.healthScore)}`}>
            {systemData.healthScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full ${
              systemData.healthScore >= 90 ? 'bg-green-500' : 
              systemData.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${systemData.healthScore}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">{systemData.alerts.critical}</div>
            <div className="text-sm text-gray-500">Critical</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{systemData.alerts.warning}</div>
            <div className="text-sm text-gray-500">Warning</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{systemData.alerts.info}</div>
            <div className="text-sm text-gray-500">Info</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{systemData.alerts.success}</div>
            <div className="text-sm text-gray-500">Success</div>
          </div>
        </div>
      </div>

      {/* Server Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Server Status
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {systemData.serverStatus.map((server) => (
            <div key={server.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(server.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {server.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {server.type.toUpperCase()} • Uptime: {server.uptime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {server.cpu}%
                    </div>
                    <div className="text-xs text-gray-500">CPU</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {server.memory}%
                    </div>
                    <div className="text-xs text-gray-500">Memory</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {server.disk}%
                    </div>
                    <div className="text-xs text-gray-500">Disk</div>
                  </div>
                  <button className="text-xs text-indigo-600 hover:text-indigo-500">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Incidents
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {systemData.recentIncidents.length > 0 ? (
            systemData.recentIncidents.map((incident) => (
              <div key={incident.id} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {incident.title}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {incident.message}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <button className="text-xs text-indigo-600 hover:text-indigo-500">
                        View Details
                      </button>
                      <button className="text-xs text-red-600 hover:text-red-500">
                        Create Incident
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
                No Recent Incidents
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All systems are operating normally.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Response Times */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            API Response Times (Last 24h)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={systemData.metricsData.api_response_time || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Request Volume */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Request Volume (Last 24h)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemData.metricsData.request_volume || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  name="Requests/min"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
