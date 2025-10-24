"use client";

import { useState } from "react";
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BellIcon
} from "@heroicons/react/24/outline";

// Mock data - in real app, this would come from API
const mockData = {
  totalTenants: 2847,
  totalTenantsChange: 12,
  activeUsers: 8432,
  activeUsersChange: 8,
  mrr: 42750,
  mrrChange: 15,
  churnRate: 2.3,
  churnRateChange: -0.5,
  recentSignups: [
    { name: "Doe Transport Ltd", plan: "Basic", time: "2 minutes ago" },
    { name: "Harare Deliveries", plan: "Free", time: "15 minutes ago" },
    { name: "ABC Fleet", plan: "Premium", time: "1 hour ago" },
    { name: "XYZ Logistics", plan: "Basic", time: "2 hours ago" },
    { name: "City Cabs", plan: "Free", time: "3 hours ago" },
  ],
  paymentFailures: [
    { name: "ABC Transport", amount: 45.00, reason: "Card declined", time: "1 hour ago" },
    { name: "XYZ Fleet Ltd", amount: 15.00, reason: "Expired card", time: "3 hours ago" },
    { name: "City Logistics", amount: 30.00, reason: "Insufficient funds", time: "5 hours ago" },
    { name: "Metro Cabs", amount: 20.00, reason: "Card declined", time: "6 hours ago" },
    { name: "Express Delivery", amount: 25.00, reason: "Expired card", time: "8 hours ago" },
  ],
  supportTickets: [
    { id: "#2847", title: "Login issues", priority: "HIGH", assignee: "Sarah K.", time: "30 minutes ago" },
    { id: "#2846", title: "Invoice error", priority: "MEDIUM", assignee: "John D.", time: "1 hour ago" },
    { id: "#2845", title: "Payment processing", priority: "LOW", assignee: "Mike R.", time: "2 hours ago" },
    { id: "#2844", title: "Account setup", priority: "MEDIUM", assignee: "Sarah K.", time: "3 hours ago" },
    { id: "#2843", title: "Feature request", priority: "LOW", assignee: "John D.", time: "4 hours ago" },
  ],
  systemAlerts: [
    { 
      type: "critical", 
      title: "High CPU usage on server-03 (94%)", 
      time: "2 minutes ago",
      description: "Last checked: 2 minutes ago"
    },
    { 
      type: "warning", 
      title: "Database backup delayed by 2 hours", 
      time: "1 hour ago",
      description: "Last backup: 10 hours ago (expected: 8 hours)"
    },
    { 
      type: "success", 
      title: "Successfully processed 1,247 payments today", 
      time: "5 minutes ago",
      description: "Total: $48,932.50 | Failed: 3 (0.24%)"
    },
  ],
  liveActivity: [
    { type: "success", message: "New tenant signup: Masvingo Cabs", time: "2s ago" },
    { type: "info", message: "Payment processed: ABC Transport ($45.00)", time: "5s ago" },
    { type: "warning", message: "Support ticket opened: #2848", time: "12s ago" },
    { type: "info", message: "User login: john@doetransport.co.zw", time: "15s ago" },
    { type: "success", message: "Remittance approved: Vehicle ABC-1234", time: "28s ago" },
    { type: "info", message: "Report generated: Financial Summary", time: "45s ago" },
  ]
};

export function SuperAdminDashboard() {
  const [isLiveFeedPaused, setIsLiveFeedPaused] = useState(false);

  const KPICard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    subtitle, 
    sparkline 
  }: {
    title: string;
    value: string | number;
    change: number;
    icon: any;
    subtitle?: string;
    sparkline?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <div className="flex items-center mt-2">
            {change > 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}% {change > 0 ? '↑' : '↓'}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </div>
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
      {subtitle && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {subtitle}
        </div>
      )}
      {sparkline && (
        <div className="mt-4 text-xs text-gray-500">
          {sparkline}
        </div>
      )}
    </div>
  );

  const AlertCard = ({ alert }: { alert: any }) => {
    const getAlertIcon = (type: string) => {
      switch (type) {
        case "critical":
          return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        case "warning":
          return <ClockIcon className="h-5 w-5 text-yellow-500" />;
        case "success":
          return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        default:
          return <BellIcon className="h-5 w-5 text-blue-500" />;
      }
    };

    const getAlertColor = (type: string) => {
      switch (type) {
        case "critical":
          return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
        case "warning":
          return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20";
        case "success":
          return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20";
        default:
          return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
        <div className="flex items-start">
          {getAlertIcon(alert.type)}
          <div className="ml-3 flex-1">
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
  };

  const ActivityCard = ({ 
    title, 
    items, 
    viewAllLink 
  }: { 
    title: string; 
    items: any[]; 
    viewAllLink: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <a 
          href={viewAllLink}
          className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          View all →
        </a>
      </div>
      <div className="space-y-3">
        {items.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {item.name || item.title || item.id}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.plan || item.amount || item.priority || item.message}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {item.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform overview and system monitoring
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 3 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Tenants"
          value={mockData.totalTenants.toLocaleString()}
          change={mockData.totalTenantsChange}
          icon={BuildingOfficeIcon}
          subtitle="• Free: 1,234 • Basic: 987 • Premium: 626"
          sparkline="[▁▂▃▅▆▇▇] 7-day trend"
        />
        <KPICard
          title="Active Users (30d)"
          value={mockData.activeUsers.toLocaleString()}
          change={mockData.activeUsersChange}
          icon={UserGroupIcon}
          subtitle="• Daily: 3,241 • Weekly: 5,892 • Monthly: 8,432"
          sparkline="[▃▄▅▆▇▇▇] 7-day trend"
        />
        <KPICard
          title="Monthly Revenue (MRR)"
          value={`$${mockData.mrr.toLocaleString()}`}
          change={mockData.mrrChange}
          icon={CurrencyDollarIcon}
          subtitle="• ARR: $513,000 • ARPU: $15.02 • LTV: $450.00"
          sparkline="[▂▃▅▆▇▇█] 7-day trend"
        />
        <KPICard
          title="Churn Rate (Monthly)"
          value={`${mockData.churnRate}%`}
          change={mockData.churnRateChange}
          icon={ChartBarIcon}
          subtitle="• Voluntary: 1.8% • Involuntary: 0.5% • Reactivated: 12"
          sparkline="[▅▄▃▃▂▂▁] 7-day trend"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Trend (Last 6 Months)
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            [Chart Placeholder - Revenue Trend]
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tenant Growth
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            [Chart Placeholder - Tenant Growth]
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Alerts
          </h3>
          <span className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
            3
          </span>
        </div>
        <div className="space-y-4">
          {mockData.systemAlerts.map((alert, index) => (
            <AlertCard key={index} alert={alert} />
          ))}
        </div>
      </div>

      {/* Recent Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityCard
          title="Recent Signups"
          items={mockData.recentSignups}
          viewAllLink="/superadmin/tenants"
        />
        <ActivityCard
          title="Payment Failures"
          items={mockData.paymentFailures}
          viewAllLink="/superadmin/billing"
        />
        <ActivityCard
          title="Support Tickets"
          items={mockData.supportTickets}
          viewAllLink="/superadmin/support"
        />
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Activity Feed
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLiveFeedPaused(!isLiveFeedPaused)}
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              {isLiveFeedPaused ? "Resume" : "Pause"}
            </button>
            <div className={`w-2 h-2 rounded-full ${isLiveFeedPaused ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`} />
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {mockData.liveActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 py-2">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'warning' ? 'bg-yellow-500' :
                activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm text-gray-900 dark:text-white">
                {activity.message}
              </span>
              <span className="text-xs text-gray-500 ml-auto">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}