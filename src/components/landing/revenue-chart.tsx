"use client";

import { useState } from "react";

interface ChartData {
  income: number;
  expense: number;
  day: string;
}

export function RevenueChart() {
  const [hoveredBar, setHoveredBar] = useState<{ type: 'income' | 'expense', index: number } | null>(null);

  const chartData: ChartData[] = [
    { income: 65, expense: 40, day: 'Mon' },
    { income: 78, expense: 45, day: 'Tue' },
    { income: 55, expense: 38, day: 'Wed' },
    { income: 88, expense: 42, day: 'Thu' },
    { income: 72, expense: 48, day: 'Fri' },
    { income: 85, expense: 50, day: 'Sat' },
    { income: 95, expense: 48, day: 'Sun' },
  ];

  return (
    <div className="bg-white dark:bg-dark-2 rounded-2xl p-8 border border-stroke/30 dark:border-dark-3/30 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-dark dark:text-white">Revenue Analytics</h3>
          <p className="text-sm text-dark-5 dark:text-dark-6 mt-1">Last 7 days performance</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6366f1' }}></div>
            <span className="text-sm text-dark-5 dark:text-dark-6">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
            <span className="text-sm text-dark-5 dark:text-dark-6">Expenses</span>
          </div>
        </div>
      </div>
      
      {/* Chart with grid and values */}
      <div className="relative h-64 rounded-xl border border-stroke/30 dark:border-dark-3/30 p-6 bg-gray-50/50 dark:bg-dark-3/30">
        {/* Grid lines */}
        <div className="absolute inset-6 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t border-stroke/30 dark:border-dark-3/30"></div>
          ))}
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-between text-xs text-dark-5 dark:text-dark-6 pointer-events-none">
          {['$50k', '$40k', '$30k', '$20k', '$10k', '$0'].map((label) => (
            <div key={label} className="leading-none">{label}</div>
          ))}
        </div>
        
        {/* Bars */}
        <div className="absolute inset-6 flex items-end justify-around gap-2 ml-10">
          {chartData.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 items-end" style={{ height: '100%' }}>
                {/* Income bar */}
                <div className="relative flex-1">
                  <div
                    className="w-full rounded-t transition-all cursor-pointer shadow-sm"
                    style={{ 
                      height: `${data.income}%`,
                      backgroundColor: hoveredBar?.type === 'income' && hoveredBar?.index === i ? '#818cf8' : '#6366f1'
                    }}
                    onMouseEnter={() => setHoveredBar({ type: 'income', index: i })}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {hoveredBar?.type === 'income' && hoveredBar?.index === i && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-20">
                        ${Math.round((data.income / 100) * 45)}k
                      </div>
                    )}
                  </div>
                </div>
                {/* Expense bar */}
                <div className="relative flex-1">
                  <div
                    className="w-full rounded-t transition-all cursor-pointer shadow-sm"
                    style={{ 
                      height: `${data.expense}%`,
                      backgroundColor: hoveredBar?.type === 'expense' && hoveredBar?.index === i ? '#fb923c' : '#f97316'
                    }}
                    onMouseEnter={() => setHoveredBar({ type: 'expense', index: i })}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {hoveredBar?.type === 'expense' && hoveredBar?.index === i && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-20">
                        ${Math.round((data.expense / 100) * 45)}k
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Day label */}
              <div className="text-xs text-dark-5 dark:text-dark-6 font-medium mt-2">{data.day}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
