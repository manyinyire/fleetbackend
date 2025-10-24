'use client';

import { useMemo } from 'react';
import { TruckIcon, CurrencyDollarIcon, TrendingUpIcon } from '@heroicons/react/24/outline';

interface Income {
  id: string;
  amount: number;
  date: string;
  vehicle: {
    registrationNumber: string;
  };
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  vehicle: {
    registrationNumber: string;
  };
}

interface TopPerformingVehiclesProps {
  incomes: Income[];
  expenses: Expense[];
}

interface VehiclePerformance {
  registrationNumber: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  profitMargin: number;
}

export function TopPerformingVehicles({ incomes, expenses }: TopPerformingVehiclesProps) {
  const vehiclePerformance = useMemo(() => {
    const vehicleData: { [key: string]: VehiclePerformance } = {};
    
    // Process incomes
    incomes.forEach(income => {
      const regNumber = income.vehicle.registrationNumber;
      if (!vehicleData[regNumber]) {
        vehicleData[regNumber] = {
          registrationNumber: regNumber,
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          transactionCount: 0,
          profitMargin: 0
        };
      }
      vehicleData[regNumber].totalIncome += Number(income.amount);
      vehicleData[regNumber].transactionCount += 1;
    });
    
    // Process expenses
    expenses.forEach(expense => {
      const regNumber = expense.vehicle.registrationNumber;
      if (!vehicleData[regNumber]) {
        vehicleData[regNumber] = {
          registrationNumber: regNumber,
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          transactionCount: 0,
          profitMargin: 0
        };
      }
      vehicleData[regNumber].totalExpenses += Number(expense.amount);
    });
    
    // Calculate net profit and profit margin
    Object.values(vehicleData).forEach(vehicle => {
      vehicle.netProfit = vehicle.totalIncome - vehicle.totalExpenses;
      vehicle.profitMargin = vehicle.totalIncome > 0 ? (vehicle.netProfit / vehicle.totalIncome) * 100 : 0;
    });
    
    // Sort by net profit and return top 5
    return Object.values(vehicleData)
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 5);
  }, [incomes, expenses]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Top Performing Vehicles</h3>
        <p className="mt-1 text-sm text-gray-500">
          Vehicles ranked by net profit
        </p>
      </div>
      
      <div className="p-6">
        {vehiclePerformance.length === 0 ? (
          <div className="text-center py-8">
            <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Performance data will appear here as transactions are recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehiclePerformance.map((vehicle, index) => (
              <div key={vehicle.registrationNumber} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 rounded-full">
                      <span className="text-sm font-medium text-indigo-600">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <TruckIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {vehicle.registrationNumber}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {vehicle.transactionCount} transactions
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-600">
                      ${vehicle.totalIncome.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Income</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-600">
                      ${vehicle.totalExpenses.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Expenses</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-sm font-medium ${vehicle.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${vehicle.netProfit.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Net Profit</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-sm font-medium ${vehicle.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {vehicle.profitMargin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Margin</div>
                  </div>
                  
                  <div className="flex items-center">
                    {vehicle.netProfit >= 0 ? (
                      <TrendingUpIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingUpIcon className="h-5 w-5 text-red-500 rotate-180" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}