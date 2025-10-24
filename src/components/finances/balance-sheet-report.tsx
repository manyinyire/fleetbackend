'use client';

import { BalanceSheetData } from '@/lib/financial-reports';
import { formatCurrency } from '@/lib/invoice';

interface BalanceSheetReportProps {
  data: BalanceSheetData;
}

export function BalanceSheetReport({ data }: BalanceSheetReportProps) {
  const formatAmount = (amount: number) => formatCurrency(amount, 'USD');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Assets</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {formatAmount(data.assets.total)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Liabilities</h3>
          <p className="text-2xl font-semibold text-red-600">
            {formatAmount(data.liabilities.total)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Equity</h3>
          <p className="text-2xl font-semibold text-green-600">
            {formatAmount(data.equity.total)}
          </p>
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assets</h3>
          
          <div className="space-y-4">
            {/* Current Assets */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">Current Assets</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cash</span>
                  <span className="text-sm font-medium">{formatAmount(data.assets.current.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accounts Receivable</span>
                  <span className="text-sm font-medium">{formatAmount(data.assets.current.accountsReceivable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Inventory</span>
                  <span className="text-sm font-medium">{formatAmount(data.assets.current.inventory)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Current Assets</span>
                    <span className="text-sm font-bold text-blue-600">{formatAmount(data.assets.current.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Assets */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">Fixed Assets</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vehicles</span>
                  <span className="text-sm font-medium">{formatAmount(data.assets.fixed.vehicles)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Equipment</span>
                  <span className="text-sm font-medium">{formatAmount(data.assets.fixed.equipment)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Fixed Assets</span>
                    <span className="text-sm font-bold text-blue-600">{formatAmount(data.assets.fixed.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Assets */}
            <div className="border-t-2 pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-medium text-gray-900">Total Assets</span>
                <span className="text-lg font-bold text-blue-600">{formatAmount(data.assets.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Liabilities & Equity</h3>
          
          <div className="space-y-4">
            {/* Current Liabilities */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">Current Liabilities</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accounts Payable</span>
                  <span className="text-sm font-medium">{formatAmount(data.liabilities.current.accountsPayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accrued Expenses</span>
                  <span className="text-sm font-medium">{formatAmount(data.liabilities.current.accruedExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Short-term Debt</span>
                  <span className="text-sm font-medium">{formatAmount(data.liabilities.current.shortTermDebt)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Current Liabilities</span>
                    <span className="text-sm font-bold text-red-600">{formatAmount(data.liabilities.current.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Long-term Liabilities */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">Long-term Liabilities</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Long-term Debt</span>
                  <span className="text-sm font-medium">{formatAmount(data.liabilities.longTerm.longTermDebt)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Long-term Liabilities</span>
                    <span className="text-sm font-bold text-red-600">{formatAmount(data.liabilities.longTerm.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Liabilities */}
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-md font-medium text-gray-900">Total Liabilities</span>
                <span className="text-md font-bold text-red-600">{formatAmount(data.liabilities.total)}</span>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">Equity</h4>
              <div className="ml-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Owner Equity</span>
                  <span className="text-sm font-medium">{formatAmount(data.equity.ownerEquity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Retained Earnings</span>
                  <span className="text-sm font-medium">{formatAmount(data.equity.retainedEarnings)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Total Equity</span>
                    <span className="text-sm font-bold text-green-600">{formatAmount(data.equity.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Liabilities & Equity */}
            <div className="border-t-2 pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-medium text-gray-900">Total Liabilities & Equity</span>
                <span className="text-lg font-bold text-gray-900">{formatAmount(data.liabilities.total + data.equity.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Period Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>Reporting Period:</strong> {data.period.label} ({data.period.startDate.toLocaleDateString()} - {data.period.endDate.toLocaleDateString()})
        </div>
      </div>
    </div>
  );
}