"use client";

import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  DocumentCheckIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  verified: boolean;
  reconciled: boolean;
  reconNotes: string | null;
  paynowReference: string | null;
  createdAt: string;
  verifiedAt: string | null;
  reconciledAt: string | null;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    description: string;
  } | null;
}

export default function ReconciliationPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [reconNotes, setReconNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/payments?verified=true&reconciled=false&status=PAID");
      const data = await response.json();

      if (response.ok) {
        setPayments(data.payments);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (paymentId: string, reconciled: boolean) => {
    try {
      setProcessing(true);
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          reconciled,
          reconNotes: reconNotes || undefined,
        }),
      });

      if (response.ok) {
        // Refresh the list
        await fetchPayments();
        setSelectedPayment(null);
        setReconNotes("");
        alert("Payment reconciled successfully");
      } else {
        alert("Failed to reconcile payment");
      }
    } catch (error) {
      console.error("Reconciliation error:", error);
      alert("An error occurred");
    } finally {
      setProcessing(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Reconciliation</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review and reconcile verified payments
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DocumentCheckIcon className="h-12 w-12 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Pending Reconciliation
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {payments.length} {payments.length === 1 ? "payment" : "payments"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total: ${payments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)} USD
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">All payments shown are:</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-end">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Verified</span>
              </div>
              <div className="flex items-center justify-end">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Paid</span>
              </div>
              <div className="flex items-center justify-end">
                <XCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Not Reconciled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
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
                  PayNow Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verified Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No matching payments found" : "No payments pending reconciliation"}
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
                        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {payment.invoice?.description || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        ${Number(payment.amount).toFixed(2)} {payment.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
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
                      <div className="text-sm text-gray-900 dark:text-white">
                        {payment.verifiedAt
                          ? new Date(payment.verifiedAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payment.verifiedAt
                          ? new Date(payment.verifiedAt).toLocaleTimeString()
                          : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <DocumentCheckIcon className="h-4 w-4 mr-1" />
                        Reconcile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Reconcile Payment
            </h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tenant</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {selectedPayment.tenant.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {selectedPayment.invoice?.invoiceNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    ${Number(selectedPayment.amount).toFixed(2)} {selectedPayment.currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">PayNow Reference</p>
                  <p className="text-base font-mono text-gray-900 dark:text-white">
                    {selectedPayment.paynowReference || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reconciliation Notes (Optional)
                </label>
                <textarea
                  value={reconNotes}
                  onChange={(e) => setReconNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add any notes about this reconciliation..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReconcile(selectedPayment.id, true)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Confirm Reconciliation"}
              </button>
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setReconNotes("");
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
