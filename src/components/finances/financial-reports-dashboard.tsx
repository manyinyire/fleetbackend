'use client';

import { useState } from 'react';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { FinancialSummaryCards } from './financial-summary-cards';
import { IncomeExpenseChart } from './income-expense-chart';
import { MonthlyTrendsChart } from './monthly-trends-chart';
import { TopPerformingVehicles } from './top-performing-vehicles';
import { RecentTransactions } from './recent-transactions';

interface Income {
  id: string;
  amount: number;
  date: string;
  description: string;
  vehicle: {
    registrationNumber: string;
  } | null;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  vehicle: {
    registrationNumber: string;
  } | null;
}

interface Remittance {
  id: string;
  amount: number;
  date: string;
  status: string;
  vehicle: {
    registrationNumber: string;
  };
  driver: {
    fullName: string;
  };
}

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  totalRemittances: number;
  netProfit: number;
}

interface FinancialReportsDashboardProps {
  incomes: Income[];
  expenses: Expense[];
  remittances: Remittance[];
  summary: Summary;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export function FinancialReportsDashboard({ 
  incomes, 
  expenses, 
  remittances, 
  summary,
  onDateRangeChange
}: FinancialReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'income', name: 'Income', icon: ArrowUpIcon },
    { id: 'expenses', name: 'Expenses', icon: ArrowDownIcon },
    { id: 'remittances', name: 'Remittances', icon: CurrencyDollarIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <FinancialSummaryCards summary={summary} />

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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <IncomeExpenseChart incomes={incomes} expenses={expenses} />
            <MonthlyTrendsChart incomes={incomes} expenses={expenses} />
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Income Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${summary.totalIncome.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Total Income</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {incomes.length}
                  </div>
                  <div className="text-sm text-blue-600">Transactions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(summary.totalIncome / Math.max(incomes.length, 1)).toFixed(2)}
                  </div>
                  <div className="text-sm text-purple-600">Avg per Transaction</div>
                </div>
              </div>
            </div>
            <RecentTransactions 
              transactions={incomes.map(income => ({
                id: income.id,
                type: 'income',
                amount: income.amount,
                date: income.date,
                description: income.description,
                vehicle: income.vehicle?.registrationNumber || 'N/A',
                driver: 'N/A'
              }))}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    ${summary.totalExpenses.toLocaleString()}
                  </div>
                  <div className="text-sm text-red-600">Total Expenses</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {expenses.length}
                  </div>
                  <div className="text-sm text-blue-600">Transactions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(summary.totalExpenses / Math.max(expenses.length, 1)).toFixed(2)}
                  </div>
                  <div className="text-sm text-purple-600">Avg per Transaction</div>
                </div>
              </div>
            </div>
            <RecentTransactions 
              transactions={expenses.map(expense => ({
                id: expense.id,
                type: 'expense',
                amount: expense.amount,
                date: expense.date,
                description: expense.description,
                vehicle: expense.vehicle?.registrationNumber || 'N/A',
                driver: 'N/A'
              }))}
            />
          </div>
        )}

        {activeTab === 'remittances' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Remittance Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${summary.totalRemittances.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">Total Remittances</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {remittances.length}
                  </div>
                  <div className="text-sm text-blue-600">Transactions</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(summary.totalRemittances / Math.max(remittances.length, 1)).toFixed(2)}
                  </div>
                  <div className="text-sm text-purple-600">Avg per Transaction</div>
                </div>
              </div>
            </div>
            <RecentTransactions 
              transactions={remittances.map(remittance => ({
                id: remittance.id,
                type: 'remittance',
                amount: remittance.amount,
                date: remittance.date,
                description: `Remittance from ${remittance.driver.fullName}`,
                vehicle: remittance.vehicle.registrationNumber,
                driver: remittance.driver.fullName
              }))}
            />
          </div>
        )}
      </div>

      {/* Top Performing Vehicles */}
      <TopPerformingVehicles incomes={incomes} expenses={expenses} />
    </div>
  );
}