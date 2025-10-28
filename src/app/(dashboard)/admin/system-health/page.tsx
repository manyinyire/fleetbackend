import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SystemHealthDashboard } from '@/components/admin/system-health-dashboard';

export default async function SystemHealthPage() {
  await requireRole('SUPER_ADMIN');

  // Fetch system health data
  const [
    systemAlerts,
    recentIncidents,
    platformMetrics,
    serverStatus
  ] = await Promise.all([
    // System Alerts - placeholder
    Promise.resolve([]),
    
    // Recent Incidents (last 30 days) - placeholder
    Promise.resolve([]),
    
    // Platform Metrics (last 24 hours) - placeholder
    Promise.resolve([]),
    
    // Server Status (placeholder data)
    Promise.resolve([
      {
        id: 'server-01',
        name: 'Web Server 01',
        type: 'web',
        status: 'healthy',
        cpu: 38,
        memory: 62,
        disk: 45,
        uptime: '99.98%'
      },
      {
        id: 'server-02',
        name: 'Web Server 02',
        type: 'web',
        status: 'healthy',
        cpu: 41,
        memory: 65,
        disk: 48,
        uptime: '99.95%'
      },
      {
        id: 'server-03',
        name: 'API Server 01',
        type: 'api',
        status: 'warning',
        cpu: 94,
        memory: 78,
        disk: 52,
        uptime: '99.89%'
      },
      {
        id: 'server-04',
        name: 'API Server 02',
        type: 'api',
        status: 'healthy',
        cpu: 52,
        memory: 71,
        disk: 38,
        uptime: '99.97%'
      },
      {
        id: 'db-primary',
        name: 'Database Primary',
        type: 'database',
        status: 'healthy',
        cpu: 24,
        memory: 54,
        disk: 67,
        uptime: '99.99%'
      },
      {
        id: 'db-replica',
        name: 'Database Replica',
        type: 'database',
        status: 'healthy',
        cpu: 18,
        memory: 48,
        disk: 45,
        uptime: '99.98%'
      },
      {
        id: 'redis-01',
        name: 'Redis Cache',
        type: 'cache',
        status: 'healthy',
        cpu: 12,
        memory: 32,
        disk: 23,
        uptime: '99.99%'
      }
    ])
  ]);

  // Process metrics data - placeholder
  const metricsByType = {
    cpu: [],
    memory: [],
    disk: [],
    network: []
  };

  // Calculate system health score - placeholder
  const criticalAlerts = 0;
  const warningAlerts = 0;
  const healthScore = 100;

  const systemData = {
    healthScore,
    alerts: {
      critical: criticalAlerts,
      warning: warningAlerts,
      info: 0,
      success: 0
    },
    systemAlerts,
    recentIncidents,
    serverStatus,
    metrics: {
      apiUptime: 99.98,
      dbStatus: 'healthy',
      avgResponseTime: 142,
      errorRate: 0.24,
      requestVolume: 1247
    },
    metricsData: metricsByType
  };

  return <SystemHealthDashboard data={systemData} />;
}
