"use client";

import { useEffect, useState } from "react";
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  verified: boolean;
  reconciled: boolean;
  paynowReference: string | null;
  createdAt: string;
  verifiedAt: string | null;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    description: string;
    type: string;
  } | null;
}

interface PaymentStats {
  byStatus: Array<{
    status: string;
    _sum: { amount: string | null };
    _count: number;
  }>;
  totalRevenue: string;
  unreconciledCount: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") {
        if (filter === "verified") params.set("verified", "true");
        else if (filter === "unverified") params.set("verified", "false");
        else if (filter === "reconciled") params.set("reconciled", "true");
        else if (filter === "unreconciled") params.set("reconciled", "false");
        else params.set("status", filter);
      }

      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setPayments(data.payments);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      PAID: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", label: "Paid" },
      PENDING: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      FAILED: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Failed" },
      CANCELLED: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", label: "Cancelled" },
    };

    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoice?.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.paynowReference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage all payment transactions
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${Number(stats.totalRevenue || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {stats.byStatus.map((stat) => (
            <div key={stat.status} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {stat.status === "PAID" && <CheckCircleIcon className="h-8 w-8 text-green-600" />}
                  {stat.status === "PENDING" && <ClockIcon className="h-8 w-8 text-yellow-600" />}
                  {stat.status === "FAILED" && <XCircleIcon className="h-8 w-8 text-red-600" />}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.status}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat._count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ${Number(stat._sum.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unreconciled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.unreconciledCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by tenant, invoice, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("PAID")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "PAID"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "PENDING"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("unreconciled")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === "unreconciled"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Unreconciled
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reconciled
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.tenant.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.tenant.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.invoice?.invoiceNumber || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.invoice?.type || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${Number(payment.amount).toFixed(2)} {payment.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {payment.paynowReference || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.verified ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.reconciled ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
