'use client';

import { useState } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  TrendingUpIcon,
  DocumentTextIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { 
  generateProfitLossData, 
  generateCashFlowData, 
  generateBalanceSheetData,
  calculateFinancialMetrics,
  FinancialPeriod,
  ProfitLossData,
  CashFlowData,
  BalanceSheetData,
  FinancialMetrics
} from '@/lib/financial-reports';
import { ProfitLossReport } from './profit-loss-report';
import { CashFlowReport } from './cash-flow-report';
import { BalanceSheetReport } from './balance-sheet-report';
import { FinancialMetricsReport } from './financial-metrics-report';

interface ComprehensiveFinancialReportsProps {
  incomes: any[];
  expenses: any[];
  vehicles: any[];
  invoices: any[];
  periods: FinancialPeriod[];
}

export function ComprehensiveFinancialReports({ 
  incomes, 
  expenses, 
  vehicles, 
  invoices,
  periods 
}: ComprehensiveFinancialReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<FinancialPeriod>(periods[0]);
  const [activeTab, setActiveTab] = useState('profit-loss');

  // Generate reports for selected period
  const pnlData = generateProfitLossData(incomes, expenses, selectedPeriod);
  const cashFlowData = generateCashFlowData(incomes, expenses, selectedPeriod);
  const balanceSheetData = generateBalanceSheetData(vehicles, expenses, incomes, selectedPeriod);
  const metrics = calculateFinancialMetrics(pnlData, balanceSheetData);

  const tabs = [
    { id: 'profit-loss', name: 'Profit & Loss', icon: TrendingUpIcon },
    { id: 'cash-flow', name: 'Cash Flow', icon: CurrencyDollarIcon },
    { id: 'balance-sheet', name: 'Balance Sheet', icon: DocumentTextIcon },
    { id: 'metrics', name: 'Financial Metrics', icon: CalculatorIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Period Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Reporting Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {periods.slice(0, 6).map((period) => (
            <button
              key={period.label}
              onClick={() => setSelectedPeriod(period)}
              className={`p-3 text-sm font-medium rounded-md border ${
                selectedPeriod.label === period.label
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <strong>Selected Period:</strong> {selectedPeriod.startDate.toLocaleDateString()} - {selectedPeriod.endDate.toLocaleDateString()}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'profit-loss' && (
          <ProfitLossReport data={pnlData} />
        )}

        {activeTab === 'cash-flow' && (
          <CashFlowReport data={cashFlowData} />
        )}

        {activeTab === 'balance-sheet' && (
          <BalanceSheetReport data={balanceSheetData} />
        )}

        {activeTab === 'metrics' && (
          <FinancialMetricsReport data={metrics} />
        )}
      </div>
    </div>
  );
}