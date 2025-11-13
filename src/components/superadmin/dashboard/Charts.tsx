"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface RevenueTrendChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const chartOptions: ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    xaxis: {
      categories: data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      labels: {
        style: {
          colors: "#6B7280"
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => `$${value.toLocaleString()}`,
        style: {
          colors: "#6B7280"
        }
      }
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4
    },
    colors: ["#4F46E5"],
    tooltip: {
      y: {
        formatter: (value) => `$${value.toLocaleString()}`
      }
    },
    theme: {
      mode: "light"
    }
  };

  const series = [
    {
      name: "MRR",
      data: data.map(d => d.revenue)
    }
  ];

  return (
    <Chart
      options={chartOptions}
      series={series}
      type="line"
      height={350}
    />
  );
}

interface TenantGrowthChartProps {
  data: Array<{
    date: string;
    free: number;
    basic: number;
    premium: number;
    total: number;
  }>;
}

export function TenantGrowthChart({ data }: TenantGrowthChartProps) {
  const chartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      stacked: true,
      toolbar: {
        show: true
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    xaxis: {
      categories: data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short' });
      }),
      labels: {
        style: {
          colors: "#6B7280"
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6B7280"
        }
      }
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.8
      }
    },
    colors: ["#9CA3AF", "#3B82F6", "#8B5CF6"],
    legend: {
      position: "top",
      horizontalAlign: "right"
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 4
    },
    tooltip: {
      y: {
        formatter: (value) => value.toLocaleString()
      }
    }
  };

  const series = [
    {
      name: "Free",
      data: data.map(d => d.free)
    },
    {
      name: "Basic",
      data: data.map(d => d.basic)
    },
    {
      name: "Premium",
      data: data.map(d => d.premium)
    }
  ];

  return (
    <Chart
      options={chartOptions}
      series={series}
      type="area"
      height={350}
    />
  );
}

interface PlanDistributionChartProps {
  data: {
    free: number;
    basic: number;
    premium: number;
  };
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  const chartOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 350
    },
    labels: ["Free", "Basic", "Premium"],
    colors: ["#9CA3AF", "#3B82F6", "#8B5CF6"],
    legend: {
      position: "bottom"
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    tooltip: {
      y: {
        formatter: (value: number) => value.toLocaleString()
      }
    }
  };

  const total = data.free + data.basic + data.premium;
  const series = total > 0 ? [
    data.free,
    data.basic,
    data.premium
  ] : [0, 0, 0];

  return (
    <Chart
      options={chartOptions}
      series={series}
      type="donut"
      height={350}
    />
  );
}

