'use client';

import { useState } from 'react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { FinancialSummaryCards } from './financial-summary-cards';
import { IncomeExpenseChart } from './income-expense-chart';
import { MonthlyTrendsChart } from './monthly-trends-chart';
import { TopPerformingVehicles } from './top-performing-vehicles';
import { RecentTransactions } from './recent-transactions';
import { getOverallStatusDisplay, getFinancialStatusDisplay } from '@/lib/vehicle-profitability';

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

interface VehicleProfitability {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  initialCost: number;
  totalRemittances: number;
  totalExpenses: number;
  cumulativeNetProfit: number;
  operationalProfit: number;
  overallStatus: 'OPERATING_IN_LOSS' | 'BREAK_EVEN' | 'PROFITABLE';
  financialStatus: 'OPERATIONAL_LOSS' | 'OPERATIONAL_BREAK_EVEN' | 'OPERATIONALLY_PROFITABLE';
  roiPercentage: number;
  paybackProgress: number;
}

interface FinancialReportsDashboardProps {
  incomes: Income[];
  expenses: Expense[];
  remittances: Remittance[];
  summary: Summary;
  vehicleProfitability?: VehicleProfitability[];
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export function FinancialReportsDashboard({
  incomes,
  expenses,
  remittances,
  summary,
  vehicleProfitability,
  onDateRangeChange
}: FinancialReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'income', name: 'Income', icon: ArrowUpIcon },
    { id: 'expenses', name: 'Expenses', icon: ArrowDownIcon },
    { id: 'remittances', name: 'Remittances', icon: CurrencyDollarIcon },
    { id: 'profitability', name: 'Vehicle Profitability', icon: TruckIcon },
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

        {activeTab === 'profitability' && vehicleProfitability && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Vehicle Profitability Analysis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Comprehensive profitability breakdown for each vehicle, showing initial investment, remittances, expenses, and overall ROI.
              </p>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {vehicleProfitability.filter(v => v.overallStatus === 'PROFITABLE').length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Profitable</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {vehicleProfitability.filter(v => v.overallStatus === 'BREAK_EVEN').length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Break-Even</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {vehicleProfitability.filter(v => v.overallStatus === 'OPERATING_IN_LOSS').length}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">In Loss</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {vehicleProfitability.length}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Vehicles</div>
                </div>
              </div>

              {/* Vehicle Profitability Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Initial Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Remittances
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Expenses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Net Profit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ROI
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {vehicleProfitability.map((vehicle) => {
                      const statusDisplay = getOverallStatusDisplay(vehicle.overallStatus);
                      return (
                        <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {vehicle.registrationNumber}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${vehicle.initialCost.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                            ${vehicle.totalRemittances.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                            ${vehicle.totalExpenses.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={vehicle.cumulativeNetProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              ${vehicle.cumulativeNetProfit.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={vehicle.roiPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {vehicle.roiPercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.badgeColor}`}>
                              {statusDisplay.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Performing Vehicles */}
      <TopPerformingVehicles incomes={incomes} expenses={expenses} />
    </div>
  );
}