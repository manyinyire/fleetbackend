"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";
import { superAdminAPI } from "@/lib/superadmin-api";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BillingData {
  summary: {
    totalRevenue: number;
    revenueChange: number;
    activeSubscriptions: number;
    subscriptionsChange: number;
    failedPayments: number;
    failedPaymentsChange: number;
    churnRate: number;
    churnRateChange: number;
  };
  planDistribution: {
    premium: number;
    basic: number;
    free: number;
    total: number;
  };
  revenueTrend: Array<{
    date: string;
    revenue: number;
    premiumTenants: number;
    basicTenants: number;
  }>;
}

const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  trial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const planColors = {
  FREE: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PREMIUM: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [failedPayments, setFailedPayments] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "transactions", name: "Transactions" },
    { id: "failed-payments", name: "Failed Payments" }
  ];

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/superadmin/invoices/${invoiceId}`, '_blank');
  };

  const handleDownloadInvoice = async (invoice: any) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    } else {
      alert('PDF not available for this invoice');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await fetch('/api/superadmin/billing/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: '30' })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error generating report');
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    if (activeTab === "transactions" || activeTab === "failed-payments") {
      loadInvoices();
    }
  }, [activeTab]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await superAdminAPI.getBillingOverview('30') as { success: boolean; data?: any };

      if (response.success && response.data) {
        setBillingData(response.data);
      }
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const response = await superAdminAPI.getInvoices({
        status: activeTab === "failed-payments" ? "OVERDUE" : undefined,
        limit: 100
      }) as { success: boolean; data?: { invoices?: any[] } };

      if (response.success && response.data) {
        if (activeTab === "failed-payments") {
          setFailedPayments(response.data.invoices || []);
        } else {
          setInvoices(response.data.invoices || []);
        }
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleRetryPayment = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to retry this payment?')) {
      return;
    }
    try {
      await superAdminAPI.retryPayment(invoiceId);
      loadInvoices();
      alert('Payment retry initiated');
    } catch (err) {
      alert('Failed to retry payment');
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "text-gray-900 dark:text-white"
  }: {
    title: string;
    value: string | number;
    change: number;
    icon: any;
    color?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
          <div className="flex items-center mt-2">
            {change > 0 ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change)}% {change > 0 ? '↑' : '↓'}
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
        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Error loading billing data
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-6">
          <button
            onClick={loadBillingData}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor revenue, subscriptions, and payment processing
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleGenerateReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Generate Report</span>
          </button>
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
      {activeTab === "overview" && billingData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue (MRR)"
              value={`$${billingData.summary.totalRevenue.toLocaleString()}`}
              change={billingData.summary.revenueChange}
              icon={CurrencyDollarIcon}
            />
            <StatCard
              title="Active Subscriptions"
              value={billingData.summary.activeSubscriptions.toLocaleString()}
              change={billingData.summary.subscriptionsChange}
              icon={ChartBarIcon}
            />
            <StatCard
              title="Failed Payments"
              value={billingData.summary.failedPayments}
              change={billingData.summary.failedPaymentsChange}
              icon={ExclamationTriangleIcon}
              color="text-red-600 dark:text-red-400"
            />
            <StatCard
              title="Churn Rate"
              value={`${billingData.summary.churnRate}%`}
              change={billingData.summary.churnRateChange}
              icon={ChartBarIcon}
              color="text-green-600 dark:text-green-400"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue Trend (Last 30 Days)
              </h3>
              {billingData.revenueTrend && billingData.revenueTrend.length > 0 ? (
                <Chart
                  options={{
                    chart: {
                      type: 'line',
                      toolbar: { show: false },
                      zoom: { enabled: false }
                    },
                    stroke: {
                      curve: 'smooth',
                      width: 3
                    },
                    colors: ['#6366f1'],
                    xaxis: {
                      categories: billingData.revenueTrend.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                      labels: {
                        style: {
                          colors: '#9ca3af'
                        }
                      }
                    },
                    yaxis: {
                      labels: {
                        formatter: (value: number) => `$${value.toFixed(0)}`,
                        style: {
                          colors: '#9ca3af'
                        }
                      }
                    },
                    grid: {
                      borderColor: '#374151',
                      strokeDashArray: 4
                    },
                    tooltip: {
                      theme: 'dark',
                      y: {
                        formatter: (value: number) => `$${value.toFixed(2)}`
                      }
                    }
                  }}
                  series={[{
                    name: 'Revenue',
                    data: billingData.revenueTrend.map(d => d.revenue)
                  }]}
                  type="line"
                  height={250}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No revenue data available
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Plan Distribution
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Premium</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {billingData.planDistribution.premium}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Basic</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {billingData.planDistribution.basic}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Free</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {billingData.planDistribution.free}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Invoices</h3>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
              Export CSV
            </button>
          </div>
          {invoicesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{invoice.tenant?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${Number(invoice.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 flex items-center space-x-1"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>View</span>
                          </button>
                          {invoice.pdfUrl && (
                            <button 
                              onClick={() => handleDownloadInvoice(invoice)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 flex items-center space-x-1"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No invoices found</p>
          )}
        </div>
      )}

      {/* Failed Payments Tab */}
      {activeTab === "failed-payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed Payments</h3>
            {failedPayments.length > 0 && (
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">
                Retry Selected
              </button>
            )}
          </div>
          {invoicesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : failedPayments.length > 0 ? (
            <div className="space-y-4">
              {failedPayments.map((invoice: any) => (
                <div key={invoice.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.tenant?.name || 'Unknown Tenant'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Invoice #{invoice.invoiceNumber} • ${Number(invoice.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRetryPayment(invoice.id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        Retry Payment
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No Failed Payments
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All payments are processing successfully.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}