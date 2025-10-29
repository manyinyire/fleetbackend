'use client';

import { useState, useEffect } from 'react';
import { FinancialReportsDashboard } from '@/components/finances/financial-reports-dashboard';

interface FinancialReportsClientProps {
  initialIncomes: any[];
  initialExpenses: any[];
  initialRemittances: any[];
  initialMaintenance?: any[];
  initialSummary: {
    totalIncome: number;
    totalExpenses: number;
    totalRemittances: number;
    netProfit: number;
  };
}

export function FinancialReportsClient({ 
  initialIncomes, 
  initialExpenses, 
  initialRemittances, 
  initialMaintenance,
  initialSummary 
}: FinancialReportsClientProps) {
  const [incomes, setIncomes] = useState(initialIncomes);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [remittances, setRemittances] = useState(initialRemittances);
  const [maintenance, setMaintenance] = useState(initialMaintenance || []);
  const [summary, setSummary] = useState(initialSummary);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (startDate?: string, endDate?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [incomesRes, expensesRes, remittancesRes, maintenanceRes] = await Promise.all([
        fetch(`/api/incomes?${params}`),
        fetch(`/api/expenses?${params}`),
        fetch(`/api/remittances?${params}`),
        fetch(`/api/maintenance?${params}`)
      ]);

      let newIncomes = incomes;
      let newExpenses = expenses;
      let newRemittances = remittances;
      let newMaintenance = maintenance;

      if (incomesRes.ok) {
        newIncomes = await incomesRes.json();
        setIncomes(newIncomes);
      }

      if (expensesRes.ok) {
        newExpenses = await expensesRes.json();
        setExpenses(newExpenses);
      }

      if (remittancesRes.ok) {
        newRemittances = await remittancesRes.json();
        setRemittances(newRemittances);
      }

      if (maintenanceRes.ok) {
        newMaintenance = await maintenanceRes.json();
        setMaintenance(newMaintenance);
      }

      // Recalculate summary using the fetched data
      const totalIncome = newRemittances.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
      const totalExpenses = newExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0) +
        newMaintenance.reduce((sum: number, m: any) => sum + Number(m.cost), 0);
      const totalRemittances = totalIncome;
      const netProfit = totalIncome - totalExpenses;

      setSummary({
        totalIncome,
        totalExpenses,
        totalRemittances,
        netProfit
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    fetchData(startDate, endDate);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive financial analytics and reporting for your fleet.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              Loading...
            </div>
          )}
        </div>
      </div>

      <FinancialReportsDashboard 
        incomes={incomes}
        expenses={expenses}
        remittances={remittances}
        summary={summary}
        onDateRangeChange={handleDateRangeChange}
      />
    </div>
  );
}
