/**
 * Financial Service Layer
 *
 * Business logic for financial management including:
 * - Income and expense tracking
 * - Profit/loss calculations
 * - Cash flow analysis
 * - Financial reporting
 */

import { PrismaClient, ExpenseCategory, IncomeSource, ExpenseStatus } from '@prisma/client';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { dbLogger } from '@/lib/logger';
import {
  NotFoundError,
  ValidationError,
  handlePrismaError,
} from '@/lib/errors';

export interface CreateExpenseDTO {
  vehicleId?: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  description: string;
  receipt?: string;
  status?: ExpenseStatus;
}

export interface CreateIncomeDTO {
  vehicleId?: string;
  source: IncomeSource;
  amount: number;
  date: Date;
  description?: string;
}

export interface FinancialFilters {
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface ExpenseFilters extends FinancialFilters {
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  minAmount?: number;
  maxAmount?: number;
}

export interface IncomeFilters extends FinancialFilters {
  source?: IncomeSource;
}

export interface ProfitLossReport {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  incomeBySource: Record<string, number>;
  expensesByCategory: Record<string, number>;
}

export interface CashFlowReport {
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
  dailyCashFlow: Array<{
    date: Date;
    income: number;
    expenses: number;
    net: number;
  }>;
}

export class FinancialService {
  private prisma: PrismaClient;
  private tenantId: string | null;

  constructor(tenantId: string | null) {
    this.tenantId = tenantId;
    this.prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;
  }

  /**
   * Create expense record
   */
  async createExpense(data: CreateExpenseDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      if (data.amount <= 0) {
        throw new ValidationError('Expense amount must be positive');
      }

      // Verify vehicle if provided
      if (data.vehicleId) {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: data.vehicleId },
        });
        if (!vehicle) {
          throw new NotFoundError('Vehicle');
        }
      }

      const expense = await this.prisma.expense.create({
        data: {
          tenantId: this.tenantId!,
          vehicleId: data.vehicleId,
          category: data.category,
          amount: data.amount,
          date: data.date,
          description: data.description,
          receipt: data.receipt,
          status: data.status || 'PENDING',
        },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
            },
          },
        },
      });

      dbLogger.info(
        {
          expenseId: expense.id,
          category: data.category,
          amount: data.amount,
          tenantId: this.tenantId,
          userId,
        },
        'Expense created'
      );

      return expense;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error creating expense');
      throw handlePrismaError(error);
    }
  }

  /**
   * Create income record
   */
  async createIncome(data: CreateIncomeDTO, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      if (data.amount <= 0) {
        throw new ValidationError('Income amount must be positive');
      }

      // Verify vehicle if provided
      if (data.vehicleId) {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: data.vehicleId },
        });
        if (!vehicle) {
          throw new NotFoundError('Vehicle');
        }
      }

      const income = await this.prisma.income.create({
        data: {
          tenantId: this.tenantId!,
          vehicleId: data.vehicleId,
          source: data.source,
          amount: data.amount,
          date: data.date,
          description: data.description,
        },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
            },
          },
        },
      });

      dbLogger.info(
        {
          incomeId: income.id,
          source: data.source,
          amount: data.amount,
          tenantId: this.tenantId,
          userId,
        },
        'Income created'
      );

      return income;
    } catch (error) {
      dbLogger.error({ err: error, data }, 'Error creating income');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get all expenses with filters
   */
  async getExpenses(filters: ExpenseFilters = {}) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const {
        vehicleId,
        category,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        page = 1,
        limit = 10,
      } = filters;

      const where: any = {};

      if (vehicleId) where.vehicleId = vehicleId;
      if (category) where.category = category;
      if (status) where.status = status;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }
      if (minAmount || maxAmount) {
        where.amount = {};
        if (minAmount) where.amount.gte = minAmount;
        if (maxAmount) where.amount.lte = maxAmount;
      }

      const [expenses, total] = await Promise.all([
        this.prisma.expense.findMany({
          where,
          include: {
            vehicle: {
              select: {
                id: true,
                registrationNumber: true,
                make: true,
                model: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            date: 'desc',
          },
        }),
        this.prisma.expense.count({ where }),
      ]);

      return {
        expenses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, filters }, 'Error getting expenses');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get all income with filters
   */
  async getIncome(filters: IncomeFilters = {}) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const { vehicleId, source, startDate, endDate, page = 1, limit = 10 } = filters;

      const where: any = {};

      if (vehicleId) where.vehicleId = vehicleId;
      if (source) where.source = source;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
      }

      const [income, total] = await Promise.all([
        this.prisma.income.findMany({
          where,
          include: {
            vehicle: {
              select: {
                id: true,
                registrationNumber: true,
                make: true,
                model: true,
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            date: 'desc',
          },
        }),
        this.prisma.income.count({ where }),
      ]);

      return {
        income,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error, filters }, 'Error getting income');
      throw handlePrismaError(error);
    }
  }

  /**
   * Approve expense
   */
  async approveExpense(expenseId: string, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const expense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });

      dbLogger.info(
        {
          expenseId,
          approvedBy: userId,
          tenantId: this.tenantId,
        },
        'Expense approved'
      );

      return expense;
    } catch (error) {
      dbLogger.error({ err: error, expenseId }, 'Error approving expense');
      throw handlePrismaError(error);
    }
  }

  /**
   * Reject expense
   */
  async rejectExpense(expenseId: string, userId: string) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const expense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: {
          status: 'REJECTED',
        },
      });

      dbLogger.info(
        {
          expenseId,
          tenantId: this.tenantId,
          userId,
        },
        'Expense rejected'
      );

      return expense;
    } catch (error) {
      dbLogger.error({ err: error, expenseId }, 'Error rejecting expense');
      throw handlePrismaError(error);
    }
  }

  /**
   * Generate profit and loss report
   */
  async getProfitLossReport(startDate: Date, endDate: Date): Promise<ProfitLossReport> {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Get total income
      const totalIncomeResult = await this.prisma.income.aggregate({
        where: dateFilter,
        _sum: {
          amount: true,
        },
      });

      // Get total expenses (only approved)
      const totalExpensesResult = await this.prisma.expense.aggregate({
        where: {
          ...dateFilter,
          status: 'APPROVED',
        },
        _sum: {
          amount: true,
        },
      });

      // Get income by source
      const incomeBySource = await this.prisma.income.groupBy({
        by: ['source'],
        where: dateFilter,
        _sum: {
          amount: true,
        },
      });

      // Get expenses by category
      const expensesByCategory = await this.prisma.expense.groupBy({
        by: ['category'],
        where: {
          ...dateFilter,
          status: 'APPROVED',
        },
        _sum: {
          amount: true,
        },
      });

      const totalIncome = Number(totalIncomeResult._sum.amount || 0);
      const totalExpenses = Number(totalExpensesResult._sum.amount || 0);
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      return {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin,
        incomeBySource: Object.fromEntries(
          incomeBySource.map(item => [item.source, Number(item._sum.amount || 0)])
        ),
        expensesByCategory: Object.fromEntries(
          expensesByCategory.map(item => [item.category, Number(item._sum.amount || 0)])
        ),
      };
    } catch (error) {
      dbLogger.error({ err: error, startDate, endDate }, 'Error generating P&L report');
      throw handlePrismaError(error);
    }
  }

  /**
   * Generate cash flow report
   */
  async getCashFlowReport(
    startDate: Date,
    endDate: Date,
    openingBalance: number = 0
  ): Promise<CashFlowReport> {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      // Get all income
      const income = await this.prisma.income.findMany({
        where: dateFilter,
        select: {
          amount: true,
          date: true,
        },
      });

      // Get all expenses
      const expenses = await this.prisma.expense.findMany({
        where: {
          ...dateFilter,
          status: 'APPROVED',
        },
        select: {
          amount: true,
          date: true,
        },
      });

      // Calculate totals
      const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      // Group by day
      const dailyCashFlow = new Map<string, { income: number; expenses: number }>();

      income.forEach(i => {
        if (!i.date) {
          return;
        }
        const dateKey = i.date.toISOString().split('T')[0] ?? '';
        const current = dailyCashFlow.get(dateKey) ?? { income: 0, expenses: 0 };
        current.income += Number(i.amount);
        dailyCashFlow.set(dateKey, current);
      });

      expenses.forEach(e => {
        if (!e.date) {
          return;
        }
        const dateKey = e.date.toISOString().split('T')[0] ?? '';
        const current = dailyCashFlow.get(dateKey) ?? { income: 0, expenses: 0 };
        current.expenses += Number(e.amount);
        dailyCashFlow.set(dateKey, current);
      });

      const dailyData = Array.from(dailyCashFlow.entries())
        .map(([dateStr, data]) => ({
          date: new Date(dateStr),
          income: data.income,
          expenses: data.expenses,
          net: data.income - data.expenses,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        openingBalance,
        totalIncome,
        totalExpenses,
        closingBalance: openingBalance + totalIncome - totalExpenses,
        dailyCashFlow: dailyData,
      };
    } catch (error) {
      dbLogger.error({ err: error, startDate, endDate }, 'Error generating cash flow report');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get financial summary for dashboard
   */
  async getFinancialSummary(startDate: Date, endDate: Date) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const [profitLoss, pendingExpensesCount, pendingExpensesTotal] = await Promise.all([
        this.getProfitLossReport(startDate, endDate),
        this.prisma.expense.count({
          where: {
            status: 'PENDING',
          },
        }),
        this.prisma.expense.aggregate({
          where: {
            status: 'PENDING',
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        ...profitLoss,
        pendingExpenses: {
          count: pendingExpensesCount,
          total: Number(pendingExpensesTotal._sum.amount || 0),
        },
      };
    } catch (error) {
      dbLogger.error({ err: error }, 'Error getting financial summary');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get vehicle profitability
   */
  async getVehicleProfitability(vehicleId: string, startDate: Date, endDate: Date) {
    try {
      if (this.tenantId) {
        await setTenantContext(this.tenantId);
      }

      const dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      const [incomeResult, expensesResult] = await Promise.all([
        this.prisma.income.aggregate({
          where: {
            vehicleId,
            ...dateFilter,
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.expense.aggregate({
          where: {
            vehicleId,
            status: 'APPROVED',
            ...dateFilter,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const income = Number(incomeResult._sum.amount || 0);
      const expenses = Number(expensesResult._sum.amount || 0);
      const profit = income - expenses;
      const profitMargin = income > 0 ? (profit / income) * 100 : 0;

      return {
        vehicleId,
        income,
        expenses,
        profit,
        profitMargin,
      };
    } catch (error) {
      dbLogger.error({ err: error, vehicleId }, 'Error calculating vehicle profitability');
      throw handlePrismaError(error);
    }
  }
}
