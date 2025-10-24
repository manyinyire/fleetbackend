'use client';

import { CashFlowData } from '@/lib/financial-reports';
import { formatCurrency } from '@/lib/invoice';

interface CashFlowReportProps {
  data: CashFlowData;
}

export function CashFlowReport({ data }: CashFlowReportProps) {
  const formatAmount = (amount: number) => formatCurrency(amount, 'USD');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Operating Cash Flow</h3>
          <p className={`text-2xl font-semibold ${data.operating.netOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(data.operating.netOperating)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Investing Cash Flow</h3>
          <p className={`text-2xl font-semibold ${data.investing.netInvesting >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(data.investing.netInvesting)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Financing Cash Flow</h3>
          <p className={`text-2xl font-semibold ${data.financing.netFinancing >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(data.financing.netFinancing)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Net Cash Flow</h3>
          <p className={`text-2xl font-semibold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatAmount(data.netCashFlow)}
          </p>
        </div>
      </div>

      {/* Cash Flow Statement */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Cash Flow Statement</h3>
        
        <div className="space-y-6">
          {/* Operating Activities */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Operating Activities</h4>
            <div className="ml-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash In from Operations</span>
                <span className="text-sm font-medium text-green-600">{formatAmount(data.operating.cashIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash Out for Operations</span>
                <span className="text-sm font-medium text-red-600">({formatAmount(data.operating.cashOut)})</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Net Operating Cash Flow</span>
                  <span className={`text-sm font-bold ${data.operating.netOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(data.operating.netOperating)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Investing Activities</h4>
            <div className="ml-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash In from Investments</span>
                <span className="text-sm font-medium text-green-600">{formatAmount(data.investing.cashIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash Out for Investments</span>
                <span className="text-sm font-medium text-red-600">({formatAmount(data.investing.cashOut)})</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Net Investing Cash Flow</span>
                  <span className={`text-sm font-bold ${data.investing.netInvesting >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(data.investing.netInvesting)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Financing Activities</h4>
            <div className="ml-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash In from Financing</span>
                <span className="text-sm font-medium text-green-600">{formatAmount(data.financing.cashIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash Out for Financing</span>
                <span className="text-sm font-medium text-red-600">({formatAmount(data.financing.cashOut)})</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Net Financing Cash Flow</span>
                  <span className={`text-sm font-bold ${data.financing.netFinancing >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(data.financing.netFinancing)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Change in Cash */}
          <div className="border-t-2 pt-4">
            <div className="flex justify-between">
              <span className="text-lg font-medium text-gray-900">Net Change in Cash</span>
              <span className={`text-lg font-bold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(data.netCashFlow)}
              </span>
            </div>
          </div>

          {/* Cash Position */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Beginning Cash</div>
                <div className="text-lg font-semibold">{formatAmount(data.beginningCash)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Ending Cash</div>
                <div className="text-lg font-semibold">{formatAmount(data.endingCash)}</div>
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