// Comprehensive financial reporting utilities

export interface FinancialPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface ProfitLossData {
  period: FinancialPeriod;
  revenue: {
    total: number;
    remittances: number;
    other: number;
  };
  expenses: {
    total: number;
    fuel: number;
    maintenance: number;
    insurance: number;
    salaries: number;
    administrative: number;
    other: number;
  };
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface CashFlowData {
  period: FinancialPeriod;
  operating: {
    cashIn: number;
    cashOut: number;
    netOperating: number;
  };
  investing: {
    cashIn: number;
    cashOut: number;
    netInvesting: number;
  };
  financing: {
    cashIn: number;
    cashOut: number;
    netFinancing: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface BalanceSheetData {
  period: FinancialPeriod;
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      total: number;
    };
    fixed: {
      vehicles: number;
      equipment: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      accountsPayable: number;
      accruedExpenses: number;
      shortTermDebt: number;
      total: number;
    };
    longTerm: {
      longTermDebt: number;
      total: number;
    };
    total: number;
  };
  equity: {
    ownerEquity: number;
    retainedEarnings: number;
    total: number;
  };
}

export interface FinancialMetrics {
  profitability: {
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  efficiency: {
    assetTurnover: number;
    receivablesTurnover: number;
    inventoryTurnover: number;
  };
  leverage: {
    debtToEquity: number;
    debtToAssets: number;
    interestCoverage: number;
  };
}

// Generate P&L data
export function generateProfitLossData(
  incomes: any[],
  expenses: any[],
  period: FinancialPeriod
): ProfitLossData {
  const periodIncomes = incomes.filter(income => 
    new Date(income.date) >= period.startDate && 
    new Date(income.date) <= period.endDate
  );
  
  const periodExpenses = expenses.filter(expense => 
    new Date(expense.date) >= period.startDate && 
    new Date(expense.date) <= period.endDate
  );

  // Revenue breakdown
  const remittances = periodIncomes
    .filter(income => income.source === 'REMITTANCE')
    .reduce((sum, income) => sum + Number(income.amount), 0);
  
  const otherRevenue = periodIncomes
    .filter(income => income.source !== 'REMITTANCE')
    .reduce((sum, income) => sum + Number(income.amount), 0);

  const totalRevenue = remittances + otherRevenue;

  // Expense breakdown
  const fuelExpenses = periodExpenses
    .filter(expense => expense.category === 'FUEL')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const maintenanceExpenses = periodExpenses
    .filter(expense => expense.category === 'MAINTENANCE')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const insuranceExpenses = periodExpenses
    .filter(expense => expense.category === 'INSURANCE')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const salaryExpenses = periodExpenses
    .filter(expense => expense.category === 'SALARY')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const administrativeExpenses = periodExpenses
    .filter(expense => expense.category === 'ADMINISTRATIVE')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const otherExpenses = periodExpenses
    .filter(expense => !['FUEL', 'MAINTENANCE', 'INSURANCE', 'SALARY', 'ADMINISTRATIVE'].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const totalExpenses = fuelExpenses + maintenanceExpenses + insuranceExpenses + 
                       salaryExpenses + administrativeExpenses + otherExpenses;

  const grossProfit = totalRevenue - (fuelExpenses + maintenanceExpenses);
  const operatingExpenses = insuranceExpenses + salaryExpenses + administrativeExpenses + otherExpenses;
  const netProfit = grossProfit - operatingExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    period,
    revenue: {
      total: totalRevenue,
      remittances,
      other: otherRevenue,
    },
    expenses: {
      total: totalExpenses,
      fuel: fuelExpenses,
      maintenance: maintenanceExpenses,
      insurance: insuranceExpenses,
      salaries: salaryExpenses,
      administrative: administrativeExpenses,
      other: otherExpenses,
    },
    grossProfit,
    operatingExpenses,
    netProfit,
    profitMargin,
  };
}

// Generate Cash Flow data
export function generateCashFlowData(
  incomes: any[],
  expenses: any[],
  period: FinancialPeriod,
  beginningCash: number = 0
): CashFlowData {
  const periodIncomes = incomes.filter(income => 
    new Date(income.date) >= period.startDate && 
    new Date(income.date) <= period.endDate
  );
  
  const periodExpenses = expenses.filter(expense => 
    new Date(expense.date) >= period.startDate && 
    new Date(expense.date) <= period.endDate
  );

  // Operating cash flow
  const operatingCashIn = periodIncomes.reduce((sum, income) => sum + Number(income.amount), 0);
  const operatingCashOut = periodExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const netOperating = operatingCashIn - operatingCashOut;

  // Investing cash flow (vehicle purchases, equipment, etc.)
  const investingCashOut = periodExpenses
    .filter(expense => ['VEHICLE_PURCHASE', 'EQUIPMENT'].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const investingCashIn = 0; // No investing cash in for this period
  const netInvesting = investingCashIn - investingCashOut;

  // Financing cash flow (loans, repayments, etc.)
  const financingCashIn = 0; // No financing cash in for this period
  const financingCashOut = periodExpenses
    .filter(expense => expense.category === 'LOAN_PAYMENT')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const netFinancing = financingCashIn - financingCashOut;

  const netCashFlow = netOperating + netInvesting + netFinancing;
  const endingCash = beginningCash + netCashFlow;

  return {
    period,
    operating: {
      cashIn: operatingCashIn,
      cashOut: operatingCashOut,
      netOperating,
    },
    investing: {
      cashIn: investingCashIn,
      cashOut: investingCashOut,
      netInvesting,
    },
    financing: {
      cashIn: financingCashIn,
      cashOut: financingCashOut,
      netFinancing,
    },
    netCashFlow,
    beginningCash,
    endingCash,
  };
}

// Generate Balance Sheet data
export function generateBalanceSheetData(
  vehicles: any[],
  expenses: any[],
  incomes: any[],
  period: FinancialPeriod
): BalanceSheetData {
  // Current assets
  const cash = incomes
    .filter(income => new Date(income.date) <= period.endDate)
    .reduce((sum, income) => sum + Number(income.amount), 0) -
    expenses
    .filter(expense => new Date(expense.date) <= period.endDate)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const accountsReceivable = 0; // Would need to track outstanding invoices
  const inventory = 0; // Would need to track parts inventory
  const currentAssets = cash + accountsReceivable + inventory;

  // Fixed assets
  const vehicleValue = vehicles.reduce((sum, vehicle) => sum + Number(vehicle.initialCost), 0);
  const equipment = 0; // Would need to track equipment
  const fixedAssets = vehicleValue + equipment;

  const totalAssets = currentAssets + fixedAssets;

  // Liabilities
  const accountsPayable = 0; // Would need to track outstanding bills
  const accruedExpenses = 0; // Would need to track accrued expenses
  const shortTermDebt = 0; // Would need to track short-term debt
  const currentLiabilities = accountsPayable + accruedExpenses + shortTermDebt;

  const longTermDebt = 0; // Would need to track long-term debt
  const totalLiabilities = currentLiabilities + longTermDebt;

  // Equity
  const ownerEquity = totalAssets - totalLiabilities;
  const retainedEarnings = ownerEquity; // Simplified
  const totalEquity = ownerEquity + retainedEarnings;

  return {
    period,
    assets: {
      current: {
        cash,
        accountsReceivable,
        inventory,
        total: currentAssets,
      },
      fixed: {
        vehicles: vehicleValue,
        equipment,
        total: fixedAssets,
      },
      total: totalAssets,
    },
    liabilities: {
      current: {
        accountsPayable,
        accruedExpenses,
        shortTermDebt,
        total: currentLiabilities,
      },
      longTerm: {
        longTermDebt,
        total: longTermDebt,
      },
      total: totalLiabilities,
    },
    equity: {
      ownerEquity,
      retainedEarnings,
      total: totalEquity,
    },
  };
}

// Calculate financial metrics
export function calculateFinancialMetrics(
  pnlData: ProfitLossData,
  balanceSheetData: BalanceSheetData
): FinancialMetrics {
  const { revenue, expenses, netProfit } = pnlData;
  const { assets, liabilities, equity } = balanceSheetData;

  // Profitability ratios
  const grossProfitMargin = revenue.total > 0 ? ((pnlData.grossProfit / revenue.total) * 100) : 0;
  const netProfitMargin = revenue.total > 0 ? ((netProfit / revenue.total) * 100) : 0;
  const returnOnAssets = assets.total > 0 ? ((netProfit / assets.total) * 100) : 0;
  const returnOnEquity = equity.total > 0 ? ((netProfit / equity.total) * 100) : 0;

  // Liquidity ratios
  const currentRatio = liabilities.current.total > 0 ? (assets.current.total / liabilities.current.total) : 0;
  const quickRatio = liabilities.current.total > 0 ? ((assets.current.cash + assets.current.accountsReceivable) / liabilities.current.total) : 0;
  const cashRatio = liabilities.current.total > 0 ? (assets.current.cash / liabilities.current.total) : 0;

  // Efficiency ratios
  const assetTurnover = assets.total > 0 ? (revenue.total / assets.total) : 0;
  const receivablesTurnover = 0; // Would need receivables data
  const inventoryTurnover = 0; // Would need inventory data

  // Leverage ratios
  const debtToEquity = equity.total > 0 ? (liabilities.total / equity.total) : 0;
  const debtToAssets = assets.total > 0 ? (liabilities.total / assets.total) : 0;
  const interestCoverage = 0; // Would need interest expense data

  return {
    profitability: {
      grossProfitMargin,
      netProfitMargin,
      returnOnAssets,
      returnOnEquity,
    },
    liquidity: {
      currentRatio,
      quickRatio,
      cashRatio,
    },
    efficiency: {
      assetTurnover,
      receivablesTurnover,
      inventoryTurnover,
    },
    leverage: {
      debtToEquity,
      debtToAssets,
      interestCoverage,
    },
  };
}

// Generate period options
export function getFinancialPeriods(): FinancialPeriod[] {
  const now = new Date();
  const periods: FinancialPeriod[] = [];

  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    periods.push({
      startDate,
      endDate,
      label: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
  }

  // Quarters
  const currentQuarter = Math.floor(now.getMonth() / 3);
  for (let i = 3; i >= 0; i--) {
    const quarter = (currentQuarter - i + 4) % 4;
    const year = now.getFullYear() - Math.floor((currentQuarter - i) / 4);
    const startDate = new Date(year, quarter * 3, 1);
    const endDate = new Date(year, quarter * 3 + 3, 0);
    periods.push({
      startDate,
      endDate,
      label: `Q${quarter + 1} ${year}`
    });
  }

  // Years
  for (let i = 2; i >= 0; i--) {
    const year = now.getFullYear() - i;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    periods.push({
      startDate,
      endDate,
      label: year.toString()
    });
  }

  return periods;
}