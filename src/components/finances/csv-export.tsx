'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  type: 'EXPENSE' | 'INCOME' | 'REMITTANCE';
  amount: number;
  date: string;
  description: string;
  category?: string;
  source?: string;
  vehicle?: {
    registrationNumber: string;
  };
  status?: string;
}

interface CSVExportProps {
  transactions: Transaction[];
  filename?: string;
}

export function CSVExport({ transactions, filename = 'transactions' }: CSVExportProps) {
  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    // Create CSV headers
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Description',
      'Category/Source',
      'Vehicle',
      'Status'
    ];

    // Create CSV rows
    const rows = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      transaction.type,
      transaction.amount.toFixed(2),
      transaction.description || '',
      transaction.category || transaction.source || '',
      transaction.vehicle?.registrationNumber || '',
      transaction.status || ''
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      Export CSV
    </button>
  );
}
