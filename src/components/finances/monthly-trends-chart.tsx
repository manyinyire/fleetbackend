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

interface MonthlyTrendsChartProps {
  incomes: Income[];
  expenses: Expense[];
}

export function MonthlyTrendsChart({ incomes, expenses }: MonthlyTrendsChartProps) {
  const trendData = useMemo(() => {
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
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [incomes, expenses]);

  const maxValue = Math.max(
    ...trendData.map(d => Math.max(d.income, d.expense))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends (Last 12 Months)</h3>
      
      <div className="space-y-3">
        {trendData.map((data, index) => {
          const incomePercentage = (data.income / maxValue) * 100;
          const expensePercentage = (data.expense / maxValue) * 100;
          const profitPercentage = (data.profit / maxValue) * 100;
          
          // Calculate trend direction
          const prevData = index > 0 ? trendData[index - 1] : null;
          const incomeTrend = prevData ? data.income - prevData.income : 0;
          const expenseTrend = prevData ? data.expense - prevData.expense : 0;
          const profitTrend = prevData ? data.profit - prevData.profit : 0;
          
          return (
            <div key={data.month} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(data.month + '-01').toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
                <div className="flex space-x-3 text-xs">
                  <span className="text-green-600">
                    Income: ${data.income.toLocaleString()}
                    {incomeTrend !== 0 && (
                      <span className={`ml-1 ${incomeTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ({incomeTrend > 0 ? '+' : ''}{incomeTrend.toLocaleString()})
                      </span>
                    )}
                  </span>
                  <span className="text-red-600">
                    Expense: ${data.expense.toLocaleString()}
                    {expenseTrend !== 0 && (
                      <span className={`ml-1 ${expenseTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        ({expenseTrend > 0 ? '+' : ''}{expenseTrend.toLocaleString()})
                      </span>
                    )}
                  </span>
                  <span className={data.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Profit: ${data.profit.toLocaleString()}
                    {profitTrend !== 0 && (
                      <span className={`ml-1 ${profitTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ({profitTrend > 0 ? '+' : ''}{profitTrend.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                {/* Income Bar */}
                <div className="flex items-center">
                  <div className="w-16 text-xs text-green-600 pr-2">Income</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${incomePercentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs text-gray-500">
                    {incomePercentage.toFixed(1)}%
                  </div>
                </div>
                
                {/* Expense Bar */}
                <div className="flex items-center">
                  <div className="w-16 text-xs text-red-600 pr-2">Expense</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${expensePercentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs text-gray-500">
                    {expensePercentage.toFixed(1)}%
                  </div>
                </div>
                
                {/* Profit Bar */}
                <div className="flex items-center">
                  <div className="w-16 text-xs text-blue-600 pr-2">Profit</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${data.profit >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.abs(profitPercentage)}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs text-gray-500">
                    {profitPercentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {trendData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No trend data available for the selected period.
        </div>
      )}
    </div>
  );
}