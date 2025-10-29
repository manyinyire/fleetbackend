'use client';

import { useState, useEffect, useCallback } from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { DateFilter } from '@/components/finances/date-filter';
import { CSVExport } from '@/components/finances/csv-export';

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
}

interface Transaction {
  id: string;
  type: 'EXPENSE' | 'INCOME' | 'REMITTANCE';
  amount: number;
  date: string | Date;
  description: string;
  category?: string;
  source?: string;
  vehicle?: {
    registrationNumber: string;
  };
  status?: string;
}

interface FinancesTransactionsPageProps {
  initialExpenses: any[];
  initialIncomes: any[];
  vehicles: Vehicle[];
  initialRemittances: any[];
  initialMaintenance: any[];
}

export default function FinancesTransactionsPage({ 
  initialExpenses, 
  initialIncomes, 
  vehicles,
  initialRemittances,
  initialMaintenance
}: FinancesTransactionsPageProps) {
  const [expenses, setExpenses] = useState(initialExpenses || []);
  const [incomes, setIncomes] = useState(initialIncomes || []);
  const [remittances, setRemittances] = useState(initialRemittances || []);
  const [maintenance, setMaintenance] = useState(initialMaintenance || []);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Combine and sort transactions using same logic as vehicle page
  const transactions = [
    ...expenses.map((e) => ({
      ...e,
      type: 'EXPENSE' as const,
    })),
    ...incomes.map((i) => ({
      ...i,
      type: 'INCOME' as const,
      category: i.source,
      status: 'APPROVED' as const,
    })),
    ...remittances.map((r) => ({
      ...r,
      type: 'REMITTANCE' as const,
      category: 'REMITTANCE',
      status: r.status,
    })),
    ...maintenance.map((m) => ({
      ...m,
      type: 'EXPENSE' as const,
      category: 'MAINTENANCE',
      amount: m.cost,
      status: 'APPROVED' as const,
    })),
  ].sort((a, b) => {
    const getDateValue = (date: any) => {
      if (!date) return 0;
      if (typeof date === 'string') return new Date(date).getTime();
      if (date instanceof Date) return date.getTime();
      return 0;
    };
    
    const dateA = getDateValue(a.date);
    const dateB = getDateValue(b.date);
    return dateB - dateA;
  });

  // Debug log
  console.log('FinancesTransactionsPage props:', { 
    initialExpenses: initialExpenses?.length, 
    initialIncomes: initialIncomes?.length,
    initialRemittances: initialRemittances?.length,
    initialMaintenance: initialMaintenance?.length,
    vehicles: vehicles?.length,
    expenses: expenses?.length,
    incomes: incomes?.length,
    remittances: remittances?.length,
    maintenance: maintenance?.length,
    transactions: transactions?.length
  });

  // Debug transaction dates
  if (transactions.length > 0) {
    console.log('Sample transaction dates:', transactions.slice(0, 3).map(t => ({
      id: t.id,
      type: t.type,
      date: t.date,
      dateType: typeof t.date,
      isValidDate: t.date ? !isNaN(new Date(t.date).getTime()) : false,
      formattedDate: t.date ? new Date(t.date).toLocaleDateString() : 'NO DATE'
    })));
  }

  // Debug raw data
  console.log('Raw data sample:', {
    expenses: expenses.slice(0, 2),
    incomes: incomes.slice(0, 2),
    remittances: remittances.slice(0, 2),
    maintenance: maintenance.slice(0, 2)
  });

  const stats = {
    // Use same logic as vehicle page
    totalRemittances: remittances.reduce((sum, r) => sum + Number(r.amount), 0),
    totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0) + 
                  maintenance.reduce((sum, m) => sum + Number(m.cost), 0),
    netProfit: remittances.reduce((sum, r) => sum + Number(r.amount), 0) - 
               (expenses.reduce((sum, e) => sum + Number(e.amount), 0) + 
                maintenance.reduce((sum, m) => sum + Number(m.cost), 0)),
    pendingExpenses: expenses.filter((e) => e.status === 'PENDING').length,
  };


  const fetchTransactions = useCallback(async () => {
    // Helper to check if a date string is within the selected range
    const isWithinRange = (isoDate?: string | Date | null) => {
      if (!isoDate) return true;
      const value = typeof isoDate === 'string' ? new Date(isoDate).getTime() : isoDate instanceof Date ? isoDate.getTime() : NaN;
      if (Number.isNaN(value)) return false;
      if (startDate && value < new Date(startDate).getTime()) return false;
      if (endDate && value > new Date(endDate).getTime()) return false;
      return true;
    };

    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [expensesRes, incomesRes] = await Promise.all([
        fetch(`/api/expenses?${params}`),
        fetch(`/api/incomes?${params}`)
      ]);

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (incomesRes.ok) {
        const incomesData = await incomesRes.json();
        setIncomes(incomesData);
      }

      // Locally filter remittances and maintenance using the same range
      const filteredRemittances = (initialRemittances || []).filter((r) => isWithinRange(r.date));
      const filteredMaintenance = (initialMaintenance || []).filter((m) => isWithinRange(m.date));
      setRemittances(filteredRemittances);
      setMaintenance(filteredMaintenance);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [startDate, endDate, initialRemittances, initialMaintenance]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDateChange = (newStartDate: string | null, newEndDate: string | null) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EXPENSE':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      case 'INCOME':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'REMITTANCE':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900';
      case 'REJECTED':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Financial Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage income and expenses across your fleet
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
          <CSVExport transactions={transactions} />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <DateFilter
          onDateChange={handleDateChange}
          initialStartDate={startDate || undefined}
          initialEndDate={endDate || undefined}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
                <span className="text-green-600 font-semibold text-sm dark:text-green-400">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Remittances</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${stats.totalRemittances.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900">
                <span className="text-red-600 font-semibold text-sm dark:text-red-400">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${stats.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900">
                <span className="text-blue-600 font-semibold text-sm dark:text-blue-400">$</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</p>
              <p className={`text-2xl font-semibold ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${stats.netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900">
                <span className="text-yellow-600 font-semibold text-sm dark:text-yellow-400">!</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Expenses</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.pendingExpenses}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-dark">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Transactions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category/Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions found</p>
                      <p className="text-gray-500 dark:text-gray-400">Start by adding some financial data to see it here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(() => {
                      const d = transaction.date;
                      if (!d) return '-';
                      if (typeof d === 'string') {
                        const t = new Date(d);
                        return isNaN(t.getTime()) ? '-' : t.toLocaleDateString();
                      }
                      // treat as Date
                      const t = (d as Date);
                      return isNaN(t.getTime()) ? '-' : t.toLocaleDateString();
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {transaction.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.category || transaction.source || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.vehicle?.registrationNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.status && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
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
