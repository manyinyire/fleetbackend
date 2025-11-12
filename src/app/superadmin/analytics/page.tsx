"use client";

import { useState, useEffect, useCallback } from "react";
import { ChartBarIcon, UserGroupIcon, ArrowTrendingUpIcon, EyeIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AnalyticsOverview {
  pageViews: number;
  uniqueUsers: number;
  signups: number;
  conversionRate: number;
  totalTenants: number;
}

interface PlanDistribution {
  plan: string;
  count: number;
  percentage: number;
}

interface FunnelStage {
  stage: string;
  value: number;
  description: string;
}

interface AnalyticsSummary {
  range: string;
  overview: AnalyticsOverview;
  planDistribution: PlanDistribution[];
  funnel: FunnelStage[];
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<string>("30d");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await superAdminAPI.getAnalyticsSummary(range) as { success: boolean; data: AnalyticsSummary };
      if (response?.success && response.data) {
        setSummary(response.data);
      } else {
        setError("Failed to load analytics data");
        setSummary(null);
      }
    } catch (err: any) {
      console.error("Failed to load analytics summary:", err);
      setError(err.message || "Failed to load analytics data");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const overview = summary?.overview || {
    pageViews: 0,
    uniqueUsers: 0,
    signups: 0,
    conversionRate: 0,
    totalTenants: 0
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Platform-wide analytics and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-500">{error}</span>
          )}
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={loadSummary}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Page Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{overview.pageViews.toLocaleString()}</p>
            </div>
            <EyeIcon className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{overview.uniqueUsers.toLocaleString()}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Signups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{overview.signups.toLocaleString()}</p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{overview.conversionRate.toFixed(2)}%</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Traffic Sources</h3>
        {summary?.planDistribution?.length ? (
          <div className="space-y-4">
            {summary.planDistribution.map((item) => (
              <div key={item.plan} className="space-y-1">
                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{item.plan}</span>
                  <span>{item.count.toLocaleString()} ({item.percentage}%)</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No plan distribution data for this range
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Signup Funnel</h3>
        {summary?.funnel?.length ? (
          <div className="space-y-4">
            {summary.funnel.map((stage, index) => (
              <div
                key={stage.stage}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index === summary.funnel.length - 1
                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                    : "bg-gray-50 dark:bg-gray-700"
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{stage.stage}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stage.description}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
            No signup funnel data for this range
          </div>
        )}
      </div>
    </div>
  );
}

