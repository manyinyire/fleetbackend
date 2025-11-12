"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChartBarSquareIcon, ClockIcon, ExclamationTriangleIcon, ServerIcon } from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  requestVolume: number;
}

interface SeriesPoint {
  label: string;
  value: number;
}

interface SlowQuery {
  id: string;
  query: string;
  avgTime: string;
  calls: number;
}

interface PerformanceResponse {
  success: boolean;
  data: {
    range: string;
    metrics: PerformanceMetrics;
    responseSeries: SeriesPoint[];
    volumeSeries: SeriesPoint[];
    slowQueries: SlowQuery[];
    incidents: Array<{
      id: string;
      title: string;
      severity: string;
      status: string;
      duration: string;
    }>;
    alerts: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
    }>;
    services: Array<{
      id: string;
      name: string;
      status: string;
      cpu: number;
      memory: number;
      uptime: string;
    }>;
  };
}

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("24h");
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 0,
    requestVolume: 0,
  });
  const [responseSeries, setResponseSeries] = useState<SeriesPoint[]>([]);
  const [volumeSeries, setVolumeSeries] = useState<SeriesPoint[]>([]);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [incidents, setIncidents] = useState<PerformanceResponse["data"]["incidents"]>([]);
  const [alerts, setAlerts] = useState<PerformanceResponse["data"]["alerts"]>([]);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await superAdminAPI.getPerformanceMetrics(range) as PerformanceResponse;
      if (response?.success && response.data) {
        setMetrics(response.data.metrics);
        setResponseSeries(response.data.responseSeries);
        setVolumeSeries(response.data.volumeSeries);
        setSlowQueries(response.data.slowQueries);
        setIncidents(response.data.incidents);
        setAlerts(response.data.alerts);
      } else {
        throw new Error("Invalid performance data");
      }
    } catch (err: any) {
      console.error("Error loading performance metrics:", err);
      setError(err.message || "Failed to load performance metrics");
      setMetrics({
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        requestVolume: 0,
      });
      setResponseSeries([]);
      setVolumeSeries([]);
      setSlowQueries([]);
      setIncidents([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const maxResponseValue = useMemo(
    () => Math.max(...responseSeries.map((point) => point.value), 1),
    [responseSeries],
  );

  const maxVolumeValue = useMemo(
    () => Math.max(...volumeSeries.map((point) => point.value), 1),
    [volumeSeries],
  );

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
        <div className="flex items-center gap-3">
          {error && <span className="text-sm text-red-500">{error}</span>}
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={loadMetrics}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Refresh
          </button>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Response Times ({range})</h3>
          {responseSeries.length ? (
            <div className="space-y-3">
              {responseSeries.map((point) => (
                <div key={point.label} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="w-16">{point.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${Math.min((point.value / maxResponseValue) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right">{point.value} ms</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No response time data available.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Volume ({range})</h3>
          {volumeSeries.length ? (
            <div className="space-y-3">
              {volumeSeries.map((point) => (
                <div key={point.label} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="w-16">{point.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.min((point.value / maxVolumeValue) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-right">{point.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No request volume data available.
            </div>
          )}
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
              {slowQueries.length ? (
                slowQueries.map((query) => (
                  <tr key={query.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{query.query}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{query.avgTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{query.calls.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No slow query data captured for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(incidents.length || alerts.length) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {incidents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Incidents</h3>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {incidents.map((incident) => (
                  <li key={incident.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{incident.title}</span>
                      <span className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        {incident.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Severity: {incident.severity} • Duration: {incident.duration}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {alerts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Alerts</h3>
              <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                {alerts.map((alert) => (
                  <li key={alert.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{alert.title}</span>
                      <span className="text-xs uppercase tracking-wide text-red-500">
                        {alert.type}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{alert.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

