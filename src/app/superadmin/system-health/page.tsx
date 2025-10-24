"use client";

import { useState } from "react";
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ServerIcon,
  DatabaseIcon,
  CloudIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from "@heroicons/react/24/outline";

// Mock data
const mockSystemHealth = {
  overall: {
    status: "healthy",
    uptime: "99.9%",
    lastCheck: "2 minutes ago"
  },
  servers: [
    {
      name: "Web Server 01",
      status: "healthy",
      cpu: 45,
      memory: 67,
      disk: 23,
      uptime: "99.9%",
      lastCheck: "1 minute ago"
    },
    {
      name: "Web Server 02",
      status: "healthy",
      cpu: 38,
      memory: 52,
      disk: 31,
      uptime: "99.8%",
      lastCheck: "1 minute ago"
    },
    {
      name: "Database Server",
      status: "warning",
      cpu: 78,
      memory: 89,
      disk: 45,
      uptime: "99.5%",
      lastCheck: "2 minutes ago"
    },
    {
      name: "Cache Server",
      status: "healthy",
      cpu: 23,
      memory: 34,
      disk: 12,
      uptime: "99.9%",
      lastCheck: "1 minute ago"
    }
  ],
  databases: [
    {
      name: "Primary DB",
      status: "healthy",
      connections: 245,
      queries: 1250,
      size: "2.4 GB",
      lastBackup: "2 hours ago"
    },
    {
      name: "Analytics DB",
      status: "healthy",
      connections: 89,
      queries: 567,
      size: "1.8 GB",
      lastBackup: "1 hour ago"
    },
    {
      name: "Logs DB",
      status: "warning",
      connections: 156,
      queries: 2340,
      size: "4.2 GB",
      lastBackup: "3 hours ago"
    }
  ],
  services: [
    {
      name: "API Gateway",
      status: "healthy",
      responseTime: "45ms",
      requests: "1,234/min",
      errors: "0.1%"
    },
    {
      name: "Authentication",
      status: "healthy",
      responseTime: "23ms",
      requests: "567/min",
      errors: "0.0%"
    },
    {
      name: "Payment Processing",
      status: "warning",
      responseTime: "156ms",
      requests: "89/min",
      errors: "2.3%"
    },
    {
      name: "Email Service",
      status: "healthy",
      responseTime: "78ms",
      requests: "45/min",
      errors: "0.5%"
    }
  ],
  alerts: [
    {
      id: 1,
      type: "critical",
      title: "High CPU usage on Database Server",
      description: "CPU usage has been above 90% for the last 15 minutes",
      time: "5 minutes ago",
      resolved: false
    },
    {
      id: 2,
      type: "warning",
      title: "Database backup delayed",
      description: "Scheduled backup is 2 hours behind schedule",
      time: "1 hour ago",
      resolved: false
    },
    {
      id: 3,
      type: "info",
      title: "Scheduled maintenance completed",
      description: "Database optimization completed successfully",
      time: "3 hours ago",
      resolved: true
    }
  ]
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
    case "warning":
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
    case "critical":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "healthy":
      return CheckCircleIcon;
    case "warning":
      return ExclamationTriangleIcon;
    case "critical":
      return XCircleIcon;
    default:
      return ClockIcon;
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "critical":
      return XCircleIcon;
    case "warning":
      return ExclamationTriangleIcon;
    case "info":
      return CheckCircleIcon;
    default:
      return ClockIcon;
  }
};

const getAlertColor = (type: string) => {
  switch (type) {
    case "critical":
      return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
    case "warning":
      return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20";
    case "info":
      return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
    default:
      return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20";
  }
};

export default function SystemHealthPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const tabs = [
    { id: "overview", name: "Overview", icon: ServerIcon },
    { id: "servers", name: "Servers", icon: CpuChipIcon },
    { id: "databases", name: "Databases", icon: DatabaseIcon },
    { id: "services", name: "Services", icon: CloudIcon },
    { id: "alerts", name: "Alerts", icon: ExclamationTriangleIcon }
  ];

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
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {mockSystemHealth.overall.lastCheck}
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${getStatusColor(mockSystemHealth.overall.status)}`}>
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                System Status: {mockSystemHealth.overall.status.toUpperCase()}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uptime: {mockSystemHealth.overall.uptime} | Last check: {mockSystemHealth.overall.lastCheck}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {mockSystemHealth.overall.uptime}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Uptime
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Servers</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">4/4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Database Connections</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">490</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Requests/min</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">1,935</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
                <span className="text-lg font-semibold text-red-600 dark:text-red-400">0.7%</span>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Alerts
            </h3>
            <div className="space-y-3">
              {mockSystemHealth.alerts.slice(0, 3).map((alert) => {
                const AlertIcon = getAlertIcon(alert.type);
                return (
                  <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start">
                      <AlertIcon className="h-5 w-5 mt-0.5 mr-3" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {alert.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {alert.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedTab === "servers" && (
        <div className="space-y-4">
          {mockSystemHealth.servers.map((server, index) => {
            const StatusIcon = getStatusIcon(server.status);
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-6 w-6 ${getStatusColor(server.status).split(' ')[0]}`} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {server.name}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {server.lastCheck}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{server.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${server.cpu > 80 ? 'bg-red-500' : server.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${server.cpu}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{server.memory}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${server.memory > 80 ? 'bg-red-500' : server.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${server.memory}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Disk</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{server.disk}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${server.disk > 80 ? 'bg-red-500' : server.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${server.disk}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{server.uptime}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last 30 days
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTab === "databases" && (
        <div className="space-y-4">
          {mockSystemHealth.databases.map((db, index) => {
            const StatusIcon = getStatusIcon(db.status);
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-6 w-6 ${getStatusColor(db.status).split(' ')[0]}`} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {db.name}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Last backup: {db.lastBackup}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{db.connections}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{db.queries}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Queries/min</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{db.size}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTab === "services" && (
        <div className="space-y-4">
          {mockSystemHealth.services.map((service, index) => {
            const StatusIcon = getStatusIcon(service.status);
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <StatusIcon className={`h-6 w-6 ${getStatusColor(service.status).split(' ')[0]}`} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {service.requests}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{service.responseTime}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{service.requests}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Requests/min</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${service.errors === '0.0%' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {service.errors}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Error Rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTab === "alerts" && (
        <div className="space-y-4">
          {mockSystemHealth.alerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.type);
            return (
              <div key={alert.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${getAlertColor(alert.type)} p-6`}>
                <div className="flex items-start">
                  <AlertIcon className={`h-6 w-6 mt-1 mr-4 ${
                    alert.type === 'critical' ? 'text-red-500' :
                    alert.type === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {alert.time}
                        </span>
                        {alert.resolved ? (
                          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:text-green-400 dark:bg-green-900/20">
                            Resolved
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full dark:text-red-400 dark:bg-red-900/20">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {alert.description}
                    </p>
                    {!alert.resolved && (
                      <div className="mt-4 flex space-x-2">
                        <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                          Acknowledge
                        </button>
                        <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                          Resolve
                        </button>
                        <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                          Create Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}