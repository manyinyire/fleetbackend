'use client';

import { useState } from 'react';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { getInvoiceStatusColor } from '@/lib/invoice';
import { InvoiceStatus } from '@/lib/invoice';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  currency: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first invoice.
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select All ({selectedInvoices.length} of {invoices.length})
              </span>
            </div>
          </div>

          {/* Invoice List */}
          <ul className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => handleSelectInvoice(invoice.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-4"
                    />
                    
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </p>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInvoiceStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {invoice.customerName}
                      </p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {formatDate(invoice.invoiceDate)}</span>
                        <span>Due: {formatDate(invoice.dueDate)}</span>
                        <span>By: {invoice.creator.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {invoice.currency}
                      </p>
                    </div>

                    <div className="flex space-x-1">
                      <button className="p-2 text-gray-400 hover:text-gray-600" title="View">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600" title="Edit">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600" title="Download PDF">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600" title="Delete">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}