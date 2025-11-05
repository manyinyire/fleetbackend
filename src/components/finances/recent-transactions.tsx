'use client';

import { CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/date-utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'remittance';
  amount: number;
  date: string;
  description: string;
  vehicle: string;
  driver: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'expense':
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      case 'remittance':
        return <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-50';
      case 'expense':
        return 'text-red-600 bg-red-50';
      case 'remittance':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Income';
      case 'expense':
        return 'Expense';
      case 'remittance':
        return 'Remittance';
      default:
        return 'Transaction';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Latest financial activity
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
            <p className="mt-1 text-sm text-gray-500">
              Transactions will appear here as they are recorded.
            </p>
          </div>
        ) : (
          transactions.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                        {getTypeLabel(transaction.type)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.vehicle} • {transaction.driver}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.type === 'income' || transaction.type === 'remittance' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {transactions.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
            View all transactions
          </button>
        </div>
      )}
    </div>
  );
}