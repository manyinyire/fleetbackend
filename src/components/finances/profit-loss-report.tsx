'use client';

import { ProfitLossData } from '@/lib/financial-reports';
import { formatCurrency } from '@/lib/invoice';

interface ProfitLossReportProps {
  data: ProfitLossData;
}

export function ProfitLossReport({ data }: ProfitLossReportProps) {
  const formatAmount = (amount: number) => formatCurrency(amount, 'USD');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-semibold text-green-600">
            {formatAmount(data.revenue.total)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="text-2xl font-semibold text-red-600">
            {formatAmount(data.expenses.total)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Gross Profit</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {formatAmount(data.grossProfit)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          <p className={`text-2xl font-semibold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(data.netProfit)}
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Remittances</span>
              <span className="text-sm font-medium">{formatAmount(data.revenue.remittances)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Other Revenue</span>
              <span className="text-sm font-medium">{formatAmount(data.revenue.other)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Total Revenue</span>
                <span className="text-sm font-bold text-green-600">{formatAmount(data.revenue.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Fuel</span>
              <span className="text-sm font-medium">{formatAmount(data.expenses.fuel)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Maintenance</span>
              <span className="text-sm font-medium">{formatAmount(data.expenses.maintenance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Insurance</span>
              <span className="text-sm font-medium">{formatAmount(data.expenses.insurance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Salaries</span>
              <span className="text-sm font-medium">{formatAmount(data.expenses.salaries)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Administrative</span>
              <span className="text-sm font-medium">{formatAmount(data.expenses.administrative)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Other</span>
              <span className="text-sm font-medium">{formatAmount(data.expenses.other)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">Total Expenses</span>
                <span className="text-sm font-bold text-red-600">{formatAmount(data.expenses.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profit Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatAmount(data.grossProfit)}</div>
            <div className="text-sm text-gray-500">Gross Profit</div>
            <div className="text-xs text-gray-400">
              {data.revenue.total > 0 ? ((data.grossProfit / data.revenue.total) * 100).toFixed(1) : 0}% margin
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{formatAmount(data.operatingExpenses)}</div>
            <div className="text-sm text-gray-500">Operating Expenses</div>
            <div className="text-xs text-gray-400">
              {data.revenue.total > 0 ? ((data.operatingExpenses / data.revenue.total) * 100).toFixed(1) : 0}% of revenue
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmount(data.netProfit)}
            </div>
            <div className="text-sm text-gray-500">Net Profit</div>
            <div className="text-xs text-gray-400">
              {data.profitMargin.toFixed(1)}% margin
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