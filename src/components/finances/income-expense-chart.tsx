'use client';

import { useMemo } from 'react';

interface Income {
  id: string;
  amount: number;
  date: string;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
}

interface IncomeExpenseChartProps {
  incomes: Income[];
  expenses: Expense[];
}

export function IncomeExpenseChart({ incomes, expenses }: IncomeExpenseChartProps) {
  const chartData = useMemo(() => {
    // Group data by month
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    
    // Process incomes
    incomes.forEach(income => {
      const month = new Date(income.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].income += Number(income.amount);
    });
    
    // Process expenses
    expenses.forEach(expense => {
      const month = new Date(expense.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expense: 0 };
      }
      monthlyData[month].expense += Number(expense.amount);
    });
    
    // Convert to array and sort by month
    const result = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
    
    return result;
  }, [incomes, expenses]);

  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.income, d.expense))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses (Last 6 Months)</h3>
      
      <div className="space-y-4">
        {chartData.map((data) => {
          const incomePercentage = (data.income / maxValue) * 100;
          const expensePercentage = (data.expense / maxValue) * 100;
          const profitPercentage = (data.profit / maxValue) * 100;
          
          return (
            <div key={data.month} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {new Date(data.month + '-01').toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
                <div className="flex space-x-4 text-xs">
                  <span className="text-green-600">Income: ${data.income.toLocaleString()}</span>
                  <span className="text-red-600">Expense: ${data.expense.toLocaleString()}</span>
                  <span className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Profit: ${data.profit.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                {/* Income Bar */}
                <div className="flex">
                  <div className="w-20 text-xs text-green-600 pr-2">Income</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-green-500 h-4 rounded-full"
                      style={{ width: `${incomePercentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {incomePercentage > 10 && `$${data.income.toLocaleString()}`}
                    </div>
                  </div>
                </div>
                
                {/* Expense Bar */}
                <div className="flex">
                  <div className="w-20 text-xs text-red-600 pr-2">Expense</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-red-500 h-4 rounded-full"
                      style={{ width: `${expensePercentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {expensePercentage > 10 && `$${data.expense.toLocaleString()}`}
                    </div>
                  </div>
                </div>
                
                {/* Profit Bar */}
                <div className="flex">
                  <div className="w-20 text-xs text-blue-600 pr-2">Profit</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className={`h-4 rounded-full ${data.profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.abs(profitPercentage)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {Math.abs(profitPercentage) > 10 && `$${data.profit.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {chartData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No financial data available for the selected period.
        </div>
      )}
    </div>
  );
}