"use client";

import { useState, useEffect } from "react";
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
import { superAdminAPI } from "@/lib/superadmin-api";
import { RevenueTrendChart, TenantGrowthChart } from "./Charts";

interface KPIData {
  totalTenants: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  activeUsers: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  mrr: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
  churnRate: {
    value: number;
    change: number;
    trend: 'up' | 'down';
  };
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp: string;
  action?: string;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

interface ActivityFeedItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function SuperAdminDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, alertsResponse, activityResponse, chartsResponse] = await Promise.all([
        superAdminAPI.getDashboardStats(),
        superAdminAPI.getDashboardAlerts(),
        superAdminAPI.getDashboardActivity(10),
        superAdminAPI.getDashboardCharts('12')
      ]);

      if (statsResponse.success) {
        setKpiData(statsResponse.data);
      }

      if (chartsResponse.success) {
        setChartData(chartsResponse.data);
      }

      if (alertsResponse.success) {
        setAlerts(alertsResponse.data.alerts);
      }

      if (activityResponse.success) {
        setRecentActivity([
          ...activityResponse.data.recentSignups.map((signup: any) => ({
            id: `signup-${signup.id}`,
            type: 'signup',
            title: 'New Tenant Signup',
            description: `${signup.name} registered for ${signup.plan} plan`,
            timestamp: signup.createdAt,
            user: 'System'
          })),
          ...activityResponse.data.paymentFailures.map((failure: any) => ({
            id: `payment-${failure.id}`,
            type: 'payment',
            title: 'Payment Failed',
            description: `${failure.tenant} - $${failure.amount} (${failure.reason})`,
            timestamp: failure.timestamp,
            user: 'System'
          })),
          ...activityResponse.data.supportTickets.map((ticket: any) => ({
            id: `ticket-${ticket.id}`,
            type: 'support',
            title: 'Support Ticket',
            description: `${ticket.tenant} - ${ticket.subject}`,
            timestamp: ticket.timestamp,
            user: 'System'
          }))
        ]);

        setActivityFeed(activityResponse.data.activityFeed);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon, 
    color = "text-gray-900 dark:text-white",
    prefix = "",
    suffix = ""
  }: {
    title: string;
    value: number;
    change: number;
    trend: 'up' | 'down';
    icon: any;
    color?: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>
            {prefix}{value.toLocaleString()}{suffix}
          </p>
          <div className="flex items-center mt-2">
            {trend === 'up' ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}% {trend === 'up' ? '↑' : '↓'}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs last month</span>
          </div>
        </div>
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
    </div>
  );

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const getAlertIcon = () => {
      switch (alert.type) {
        case 'critical':
          return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        case 'warning':
          return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
        case 'success':
          return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        default:
          return <BellIcon className="h-5 w-5 text-blue-500" />;
      }
    };

    const getAlertColor = () => {
      switch (alert.type) {
        case 'critical':
          return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
        case 'warning':
          return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
        case 'success':
          return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
        default:
          return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${getAlertColor()}`}>
        <div className="flex items-start">
          {getAlertIcon()}
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
            {alert.action && (
              <button className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 mt-1">
                {alert.action}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ActivityCard = ({ activity }: { activity: Activity }) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'signup':
          return <UserGroupIcon className="h-5 w-5 text-green-500" />;
        case 'payment':
          return <CurrencyDollarIcon className="h-5 w-5 text-blue-500" />;
        case 'support':
          return <BellIcon className="h-5 w-5 text-yellow-500" />;
        default:
          return <ClockIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
        {getActivityIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {activity.title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activity.description}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {new Date(activity.timestamp).toLocaleString()} • {activity.user}
          </p>
        </div>
      </div>
    );
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
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Error loading dashboard
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-6">
          <button
            onClick={loadDashboardData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total Tenants"
            value={kpiData.totalTenants.value}
            change={kpiData.totalTenants.change}
            trend={kpiData.totalTenants.trend}
            icon={BuildingOfficeIcon}
          />
          <KPICard
            title="Active Users"
            value={kpiData.activeUsers.value}
            change={kpiData.activeUsers.change}
            trend={kpiData.activeUsers.trend}
            icon={UserGroupIcon}
          />
          <KPICard
            title="Monthly Recurring Revenue"
            value={kpiData.mrr.value}
            change={kpiData.mrr.change}
            trend={kpiData.mrr.trend}
            icon={CurrencyDollarIcon}
            prefix="$"
          />
          <KPICard
            title="Churn Rate"
            value={kpiData.churnRate.value}
            change={kpiData.churnRate.change}
            trend={kpiData.churnRate.trend}
            icon={ChartBarIcon}
            suffix="%"
            color="text-green-600 dark:text-green-400"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue Trend (Last 12 Months)
          </h3>
          {chartData?.revenueTrend ? (
            <RevenueTrendChart data={chartData.revenueTrend} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Loading chart data...
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tenant Growth (Last 12 Months)
          </h3>
          {chartData?.tenantGrowth ? (
            <TenantGrowthChart data={chartData.tenantGrowth} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Loading chart data...
            </div>
          )}
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Alerts
        </h3>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No alerts at this time
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Signups
          </h3>
          <div className="space-y-3">
            {recentActivity
              .filter(activity => activity.type === 'signup')
              .slice(0, 5)
              .map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Failures
          </h3>
          <div className="space-y-3">
            {recentActivity
              .filter(activity => activity.type === 'payment')
              .slice(0, 5)
              .map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Support Tickets
          </h3>
          <div className="space-y-3">
            {recentActivity
              .filter(activity => activity.type === 'support')
              .slice(0, 5)
              .map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Live Activity Feed
        </h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activityFeed.length > 0 ? (
            activityFeed.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <ClockIcon className="h-4 w-4 text-gray-400 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {item.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </div>
    </div>
  );
}