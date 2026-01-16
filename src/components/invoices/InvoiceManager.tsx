'use client';

import { useState, useEffect } from 'react';
import { DocumentTextIcon, PaperAirplaneIcon, EyeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ExpressCheckoutModal } from '@/components/payments/express-checkout-modal';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  amount: number | string; // Can be string from Prisma Decimal type
  dueDate: string;
  createdAt: string;
  pdfUrl?: string;
  paymentReference?: string;
  paymentMethod?: string;
  paidAt?: string;
}

interface InvoiceManagerProps {
  tenantId?: string; // Optional since it's not used (API handles it via auth)
}

export function InvoiceManager({ tenantId }: InvoiceManagerProps = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [showExpressCheckout, setShowExpressCheckout] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: string;
    number: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      const result = await response.json();

      if (response.ok) {
        // API returns paginated response with data property
        setInvoices(result.data || []);
      } else {
        toast.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice({
      id: invoice.id,
      number: invoice.invoiceNumber,
      amount: Number(invoice.amount),
    });
    setShowExpressCheckout(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION':
        return 'bg-blue-100 text-blue-800';
      case 'UPGRADE':
        return 'bg-purple-100 text-purple-800';
      case 'RENEWAL':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600">Manage your billing and invoices</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by generating your first invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                        {invoice.status === 'PAID' && invoice.paymentReference && (
                          <div className="text-xs text-green-600 mt-0.5">
                            Ref: {invoice.paymentReference}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(invoice.type)}`}>
                        {invoice.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${Number(invoice.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                        {invoice.status === 'PAID' && invoice.paidAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Paid: {new Date(invoice.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 items-center">
                        {invoice.status === 'PENDING' && (
                          <button
                            onClick={() => handlePayNow(invoice)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Pay Now
                          </button>
                        )}
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl.startsWith('http') || invoice.pdfUrl.startsWith('/') ? invoice.pdfUrl : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Invoice PDF"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Express Checkout Modal */}
      {showExpressCheckout && selectedInvoice && (
        <ExpressCheckoutModal
          invoiceId={selectedInvoice.id}
          amount={selectedInvoice.amount}
          invoiceNumber={selectedInvoice.number}
          onSuccess={() => {
            setShowExpressCheckout(false);
            setSelectedInvoice(null);
            toast.success('Payment successful!');
            fetchInvoices(); // Refresh invoice list
          }}
          onClose={() => {
            setShowExpressCheckout(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
}