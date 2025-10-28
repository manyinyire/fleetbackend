/**
 * Vehicle Profitability Utilities
 * 
 * This module calculates two key profitability metrics:
 * 1. Overall Vehicle Status (ROI-based, long-term)
 * 2. Financial Status (Operational performance, short-term)
 */

export interface VehicleProfitabilityData {
  // Overall Status (ROI-based)
  cumulativeNetProfit: number;
  overallStatus: 'OPERATING_IN_LOSS' | 'BREAK_EVEN' | 'PROFITABLE';
  
  // Financial Status (Operational)
  operationalProfit: number;
  financialStatus: 'OPERATIONAL_LOSS' | 'OPERATIONAL_BREAK_EVEN' | 'OPERATIONALLY_PROFITABLE';
  
  // Raw data
  initialCost: number;
  totalRemittances: number;
  totalExpenses: number;
  driverSalary: number;
  
  // Additional metrics
  roiPercentage: number;
  paybackProgress: number; // 0-100, percentage of initial cost recovered
}

export interface VehicleFinancialData {
  initialCost: number;
  createdAt: Date;
  remittances: Array<{
    amount: number;
    date: Date;
  }>;
  expenses: Array<{
    amount: number;
    date: Date;
  }>;
  // Driver salary for the period (calculated based on payment model)
  driverSalary?: number;
}

/**
 * Calculate cumulative net profit since vehicle purchase
 */
export function calculateCumulativeNetProfit(
  totalRemittances: number,
  totalExpenses: number,
  driverSalary: number,
  initialCost: number
): number {
  return totalRemittances - totalExpenses - driverSalary - initialCost;
}

/**
 * Calculate operational profit (excluding depreciation)
 */
export function calculateOperationalProfit(
  totalRemittances: number,
  totalExpenses: number,
  driverSalary: number
): number {
  return totalRemittances - totalExpenses - driverSalary;
}

/**
 * Determine overall vehicle status based on cumulative net profit
 */
export function getOverallStatus(cumulativeNetProfit: number, initialCost: number): 'OPERATING_IN_LOSS' | 'BREAK_EVEN' | 'PROFITABLE' {
  if (cumulativeNetProfit < 0) {
    return 'OPERATING_IN_LOSS';
  }
  if (cumulativeNetProfit === 0) {
    return 'BREAK_EVEN';
  }
  return 'PROFITABLE';
}

/**
 * Determine financial status based on operational profit
 */
export function getFinancialStatus(operationalProfit: number): 'OPERATIONAL_LOSS' | 'OPERATIONAL_BREAK_EVEN' | 'OPERATIONALLY_PROFITABLE' {
  if (operationalProfit < 0) {
    return 'OPERATIONAL_LOSS';
  }
  if (operationalProfit === 0) {
    return 'OPERATIONAL_BREAK_EVEN';
  }
  return 'OPERATIONALLY_PROFITABLE';
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(cumulativeNetProfit: number, initialCost: number): number {
  if (initialCost === 0) return 0;
  return (cumulativeNetProfit / initialCost) * 100;
}

/**
 * Calculate payback progress (0-100%)
 */
export function calculatePaybackProgress(
  totalRemittances: number,
  totalExpenses: number,
  driverSalary: number,
  initialCost: number
): number {
  const totalRecovered = totalRemittances - totalExpenses - driverSalary;
  if (totalRecovered <= 0) return 0;
  if (initialCost === 0) return 100;
  
  const progress = (totalRecovered / initialCost) * 100;
  return Math.min(progress, 100); // Cap at 100%
}

/**
 * Main function to calculate all profitability metrics for a vehicle
 */
export function calculateVehicleProfitability(
  data: VehicleFinancialData
): VehicleProfitabilityData {
  // Calculate totals
  const totalRemittances = data.remittances.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const driverSalary = data.driverSalary || 0;
  const initialCost = Number(data.initialCost);

  // Calculate metrics
  const cumulativeNetProfit = calculateCumulativeNetProfit(
    totalRemittances,
    totalExpenses,
    driverSalary,
    initialCost
  );

  const operationalProfit = calculateOperationalProfit(
    totalRemittances,
    totalExpenses,
    driverSalary
  );

  const overallStatus = getOverallStatus(cumulativeNetProfit, initialCost);
  const financialStatus = getFinancialStatus(operationalProfit);
  const roiPercentage = calculateROI(cumulativeNetProfit, initialCost);
  const paybackProgress = calculatePaybackProgress(
    totalRemittances,
    totalExpenses,
    driverSalary,
    initialCost
  );

  return {
    cumulativeNetProfit,
    overallStatus,
    operationalProfit,
    financialStatus,
    initialCost,
    totalRemittances,
    totalExpenses,
    driverSalary,
    roiPercentage,
    paybackProgress,
  };
}

/**
 * Get status display properties for Overall Status
 */
export function getOverallStatusDisplay(status: 'OPERATING_IN_LOSS' | 'BREAK_EVEN' | 'PROFITABLE') {
  switch (status) {
    case 'OPERATING_IN_LOSS':
      return {
        label: 'Operating in Loss',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      };
    case 'BREAK_EVEN':
      return {
        label: 'Break-Even',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      };
    case 'PROFITABLE':
      return {
        label: 'Profitable',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      };
  }
}

/**
 * Get status display properties for Financial Status
 */
export function getFinancialStatusDisplay(status: 'OPERATIONAL_LOSS' | 'OPERATIONAL_BREAK_EVEN' | 'OPERATIONALLY_PROFITABLE') {
  switch (status) {
    case 'OPERATIONAL_LOSS':
      return {
        label: 'Operational Loss',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        description: 'Current remittances do not cover operational costs',
      };
    case 'OPERATIONAL_BREAK_EVEN':
      return {
        label: 'Operational Break-Even',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        description: 'Remittances exactly cover operational costs',
      };
    case 'OPERATIONALLY_PROFITABLE':
      return {
        label: 'Operationally Profitable',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        description: 'Remittances exceed operational costs',
      };
  }
}
