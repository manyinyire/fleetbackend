"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  DatabaseIcon,
  CloudIcon,
  BellIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

interface SystemHealth {
  overall: {
    status: string;
    uptime: string;
    lastCheck: string;
  };
  servers: Array<{
    id: string;
    name: string;
    status: string;
    cpu: number;
    memory: number;
    disk: number;
    uptime: string;
  }>;
  databases: Array<{
    id: string;
    name: string;
    status: string;
    connections: number;
    queries: number;
    responseTime: number;
    uptime: string;
  }>;
  services: Array<{
    id: string;
    name: string;
    status: string;
    responseTime: number;
    errorRate: number;
    uptime: string;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    status: string;
  }>;
}

export default function SystemHealthPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "servers", name: "Servers" },
    { id: "databases", name: "Databases" },
    { id: "services", name: "Services" },
    { id: "alerts", name: "Alerts" }
  ];

  useEffect(() => {
    loadSystemHealth();
  }, []);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await superAdminAPI.getSystemHealth();

      if (response.success) {
        setSystemHealth(response.data);
      }
    } catch (err) {
      console.error('Error loading system health:', err);
      setError('Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <BellIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };

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
        <ServerIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Error loading system health
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-6">
          <button
            onClick={loadSystemHealth}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!systemHealth) {
    return (
      <div className="text-center py-12">
        <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No system health data available
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Health
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor system performance and health metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadSystemHealth}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(systemHealth.overall.status)}
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                System Status
              </h3>
              <p className={`text-sm ${getStatusColor(systemHealth.overall.status)}`}>
                {systemHealth.overall.status.toUpperCase()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {systemHealth.overall.uptime}
            </p>
          </div>
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
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Servers
            </h3>
            <div className="space-y-3">
              {systemHealth.servers.map((server) => (
                <div key={server.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(server.status)}
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {server.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CPU: {server.cpu}% | RAM: {server.memory}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Databases
            </h3>
            <div className="space-y-3">
              {systemHealth.databases.map((db) => (
                <div key={db.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(db.status)}
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {db.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {db.connections} conn | {db.responseTime}ms
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Services
            </h3>
            <div className="space-y-3">
              {systemHealth.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(service.status)}
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {service.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {service.responseTime}ms | {service.errorRate}% errors
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Servers Tab */}
      {activeTab === "servers" && (
        <div className="space-y-6">
          {systemHealth.servers.map((server) => (
            <div key={server.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ServerIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {server.name}
                  </h3>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(server.status)}
                  <span className={`ml-2 text-sm font-medium ${getStatusColor(server.status)}`}>
                    {server.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${server.cpu}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{server.cpu}%</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${server.memory}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{server.memory}%</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ width: `${server.disk}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{server.disk}%</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uptime: <span className="font-medium text-gray-900 dark:text-white">{server.uptime}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Databases Tab */}
      {activeTab === "databases" && (
        <div className="space-y-6">
          {systemHealth.databases.map((db) => (
            <div key={db.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DatabaseIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {db.name}
                  </h3>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(db.status)}
                  <span className={`ml-2 text-sm font-medium ${getStatusColor(db.status)}`}>
                    {db.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connections</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{db.connections}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Queries/min</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{db.queries}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{db.responseTime}ms</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uptime: <span className="font-medium text-gray-900 dark:text-white">{db.uptime}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Services Tab */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {systemHealth.services.map((service) => (
            <div key={service.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CloudIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {service.name}
                  </h3>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(service.status)}
                  <span className={`ml-2 text-sm font-medium ${getStatusColor(service.status)}`}>
                    {service.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{service.responseTime}ms</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Error Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{service.errorRate}%</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{service.uptime}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {systemHealth.alerts.length > 0 ? (
            systemHealth.alerts.map((alert) => (
              <div key={alert.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start">
                  {getAlertIcon(alert.type)}
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {alert.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                    <div className="mt-3 flex space-x-2">
                      <button className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                        Acknowledge
                      </button>
                      <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Resolve
                      </button>
                      <button className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Create Ticket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No alerts
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All systems are operating normally.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}