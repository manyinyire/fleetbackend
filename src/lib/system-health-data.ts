interface ServerStatus {
  id: string;
  name: string;
  type: string;
  status: "healthy" | "warning" | "critical";
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
}

interface SystemAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  startTime: Date;
  endTime: Date;
  duration: string;
  description: string;
}

interface MetricsDataPoint {
  time: string;
  value: number;
}

export interface SystemHealthSnapshot {
  healthScore: number;
  alerts: {
    critical: number;
    warning: number;
    info: number;
    success: number;
  };
  systemAlerts: SystemAlert[];
  recentIncidents: Incident[];
  serverStatus: ServerStatus[];
  metrics: {
    apiUptime: number;
    dbStatus: string;
    avgResponseTime: number;
    errorRate: number;
    requestVolume: number;
    activeConnections: number;
    cacheHitRate: number;
  };
  metricsData: {
    cpu: MetricsDataPoint[];
    memory: MetricsDataPoint[];
    disk: MetricsDataPoint[];
    network: MetricsDataPoint[];
  };
}

/**
 * Temporary helper returning mocked system health data.
 * In production this should be replaced with telemetry collected
 * from the actual observability stack.
 */
export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const now = new Date();

  return {
    healthScore: 98.5,
    alerts: {
      critical: 0,
      warning: 2,
      info: 5,
      success: 12,
    },
    systemAlerts: [
      {
        id: "1",
        type: "WARNING",
        title: "High CPU usage on server-03",
        message: "CPU usage at 85%",
        timestamp: now,
        acknowledged: false,
      },
      {
        id: "2",
        type: "INFO",
        title: "Database backup completed",
        message: "Daily backup completed successfully",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        acknowledged: true,
      },
    ],
    recentIncidents: [
      {
        id: "1",
        title: "API Response Time Spike",
        severity: "medium",
        status: "resolved",
        startTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        duration: "1 hour",
        description: "API response times increased to 2.5s average",
      },
    ],
    serverStatus: [
      {
        id: "server-01",
        name: "Web Server 01",
        type: "web",
        status: "healthy",
        cpu: 38,
        memory: 62,
        disk: 45,
        uptime: "99.98%",
      },
      {
        id: "server-02",
        name: "Web Server 02",
        type: "web",
        status: "healthy",
        cpu: 41,
        memory: 65,
        disk: 48,
        uptime: "99.95%",
      },
      {
        id: "server-03",
        name: "API Server 01",
        type: "api",
        status: "warning",
        cpu: 85,
        memory: 78,
        disk: 52,
        uptime: "99.89%",
      },
      {
        id: "server-04",
        name: "API Server 02",
        type: "api",
        status: "healthy",
        cpu: 52,
        memory: 71,
        disk: 38,
        uptime: "99.97%",
      },
      {
        id: "db-primary",
        name: "Database Primary",
        type: "database",
        status: "healthy",
        cpu: 24,
        memory: 54,
        disk: 67,
        uptime: "99.99%",
      },
      {
        id: "db-replica",
        name: "Database Replica",
        type: "database",
        status: "healthy",
        cpu: 18,
        memory: 48,
        disk: 45,
        uptime: "99.98%",
      },
      {
        id: "redis-01",
        name: "Redis Cache",
        type: "cache",
        status: "healthy",
        cpu: 12,
        memory: 32,
        disk: 23,
        uptime: "99.99%",
      },
    ],
    metrics: {
      apiUptime: 99.98,
      dbStatus: "healthy",
      avgResponseTime: 142,
      errorRate: 0.24,
      requestVolume: 1247,
      activeConnections: 89,
      cacheHitRate: 94.2,
    },
    metricsData: {
      cpu: [
        { time: "00:00", value: 25 },
        { time: "04:00", value: 20 },
        { time: "08:00", value: 45 },
        { time: "12:00", value: 60 },
        { time: "16:00", value: 55 },
        { time: "20:00", value: 35 },
      ],
      memory: [
        { time: "00:00", value: 45 },
        { time: "04:00", value: 42 },
        { time: "08:00", value: 65 },
        { time: "12:00", value: 78 },
        { time: "16:00", value: 72 },
        { time: "20:00", value: 58 },
      ],
      disk: [
        { time: "00:00", value: 35 },
        { time: "04:00", value: 36 },
        { time: "08:00", value: 38 },
        { time: "12:00", value: 42 },
        { time: "16:00", value: 45 },
        { time: "20:00", value: 48 },
      ],
      network: [
        { time: "00:00", value: 120 },
        { time: "04:00", value: 95 },
        { time: "08:00", value: 250 },
        { time: "12:00", value: 380 },
        { time: "16:00", value: 320 },
        { time: "20:00", value: 180 },
      ],
    },
  };
}

