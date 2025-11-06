import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FinancialService, ProfitLossReport, CashFlowReport } from '@/services/financial.service';
import { prisma } from '@/lib/prisma';

/**
 * Unit Tests for FinancialService
 * Tests income/expense tracking, profit/loss calculations, cash flow analysis
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    income: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    vehicle: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock tenant utilities
jest.mock('@/lib/get-tenant-prisma', () => ({
  getTenantPrisma: jest.fn(() => require('@/lib/prisma').prisma),
}));

jest.mock('@/lib/tenant', () => ({
  setTenantContext: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  dbLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('FinancialService', () => {
  let financialService: FinancialService;
  const tenantId = 'tenant-123';
  const userId = 'user-1';

  beforeEach(() => {
    financialService = new FinancialService(tenantId);
    jest.clearAllMocks();
  });

  describe('createExpense', () => {
    it('should create expense successfully', async () => {
      const expenseData = {
        category: 'FUEL' as const,
        amount: 150.50,
        date: new Date('2024-06-15'),
        description: 'Fuel for vehicle ABC-123',
        vehicleId: 'vehicle-1',
      };

      const mockExpense = {
        id: 'expense-1',
        tenantId,
        ...expenseData,
        status: 'PENDING',
        vehicle: { id: 'vehicle-1', registrationNumber: 'ABC-123' },
      };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue({ id: 'vehicle-1' });
      (prisma.expense.create as jest.Mock).mockResolvedValue(mockExpense);

      const result = await financialService.createExpense(expenseData, userId);

      expect(result).toBeDefined();
      expect(result.amount).toBe(150.50);
      expect(result.category).toBe('FUEL');
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            amount: 150.50,
            category: 'FUEL',
            status: 'PENDING',
          }),
        })
      );
    });

    it('should reject negative expense amount', async () => {
      const expenseData = {
        category: 'FUEL' as const,
        amount: -50,
        date: new Date(),
        description: 'Invalid expense',
      };

      await expect(
        financialService.createExpense(expenseData, userId)
      ).rejects.toThrow('Expense amount must be positive');
    });

    it('should reject zero expense amount', async () => {
      const expenseData = {
        category: 'FUEL' as const,
        amount: 0,
        date: new Date(),
        description: 'Zero expense',
      };

      await expect(
        financialService.createExpense(expenseData, userId)
      ).rejects.toThrow('Expense amount must be positive');
    });

    it('should throw NotFoundError for invalid vehicle', async () => {
      const expenseData = {
        category: 'FUEL' as const,
        amount: 100,
        date: new Date(),
        description: 'Test expense',
        vehicleId: 'invalid-vehicle',
      };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        financialService.createExpense(expenseData, userId)
      ).rejects.toThrow('Vehicle not found');
    });

    it('should create expense without vehicle', async () => {
      const expenseData = {
        category: 'OFFICE' as const,
        amount: 250,
        date: new Date(),
        description: 'Office supplies',
      };

      const mockExpense = {
        id: 'expense-1',
        tenantId,
        ...expenseData,
        vehicleId: null,
        status: 'PENDING',
      };

      (prisma.expense.create as jest.Mock).mockResolvedValue(mockExpense);

      const result = await financialService.createExpense(expenseData, userId);

      expect(result.vehicleId).toBeNull();
      expect(prisma.vehicle.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('createIncome', () => {
    it('should create income successfully', async () => {
      const incomeData = {
        source: 'TRIP_FARE' as const,
        amount: 500.75,
        date: new Date('2024-06-15'),
        description: 'Trip income',
        vehicleId: 'vehicle-1',
      };

      const mockIncome = {
        id: 'income-1',
        tenantId,
        ...incomeData,
        vehicle: { id: 'vehicle-1', registrationNumber: 'ABC-123' },
      };

      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValue({ id: 'vehicle-1' });
      (prisma.income.create as jest.Mock).mockResolvedValue(mockIncome);

      const result = await financialService.createIncome(incomeData, userId);

      expect(result).toBeDefined();
      expect(result.amount).toBe(500.75);
      expect(result.source).toBe('TRIP_FARE');
    });

    it('should reject negative income amount', async () => {
      const incomeData = {
        source: 'TRIP_FARE' as const,
        amount: -100,
        date: new Date(),
      };

      await expect(
        financialService.createIncome(incomeData, userId)
      ).rejects.toThrow('Income amount must be positive');
    });

    it('should reject zero income amount', async () => {
      const incomeData = {
        source: 'TRIP_FARE' as const,
        amount: 0,
        date: new Date(),
      };

      await expect(
        financialService.createIncome(incomeData, userId)
      ).rejects.toThrow('Income amount must be positive');
    });
  });

  describe('getExpenses', () => {
    it('should return paginated expenses', async () => {
      const mockExpenses = [
        {
          id: '1',
          amount: 150,
          category: 'FUEL',
          date: new Date('2024-06-15'),
          vehicle: { id: 'v1', registrationNumber: 'ABC-123', make: 'Toyota', model: 'Hiace' },
        },
        {
          id: '2',
          amount: 200,
          category: 'MAINTENANCE',
          date: new Date('2024-06-14'),
          vehicle: { id: 'v2', registrationNumber: 'XYZ-789', make: 'Nissan', model: 'Caravan' },
        },
      ];

      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);
      (prisma.expense.count as jest.Mock).mockResolvedValue(25);

      const result = await financialService.getExpenses({ page: 1, limit: 10 });

      expect(result.expenses).toHaveLength(2);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3); // ceil(25/10)
    });

    it('should filter by category', async () => {
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.expense.count as jest.Mock).mockResolvedValue(0);

      await financialService.getExpenses({ category: 'FUEL' });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'FUEL' }),
        })
      );
    });

    it('should filter by status', async () => {
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.expense.count as jest.Mock).mockResolvedValue(0);

      await financialService.getExpenses({ status: 'APPROVED' });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.expense.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.expense.count as jest.Mock).mockResolvedValue(0);

      await financialService.getExpenses({ startDate, endDate });

      const callArgs = (prisma.expense.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.date.gte).toEqual(startDate);
      expect(callArgs.where.date.lte).toEqual(endDate);
    });

    it('should filter by amount range', async () => {
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.expense.count as jest.Mock).mockResolvedValue(0);

      await financialService.getExpenses({ minAmount: 100, maxAmount: 500 });

      const callArgs = (prisma.expense.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.amount.gte).toBe(100);
      expect(callArgs.where.amount.lte).toBe(500);
    });
  });

  describe('approveExpense', () => {
    it('should approve expense successfully', async () => {
      const expenseId = 'expense-1';
      const mockExpense = {
        id: expenseId,
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: expect.any(Date),
      };

      (prisma.expense.update as jest.Mock).mockResolvedValue(mockExpense);

      const result = await financialService.approveExpense(expenseId, userId);

      expect(result.status).toBe('APPROVED');
      expect(result.approvedBy).toBe(userId);
      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: expenseId },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: expect.any(Date),
        },
      });
    });
  });

  describe('rejectExpense', () => {
    it('should reject expense successfully', async () => {
      const expenseId = 'expense-1';
      const mockExpense = {
        id: expenseId,
        status: 'REJECTED',
      };

      (prisma.expense.update as jest.Mock).mockResolvedValue(mockExpense);

      const result = await financialService.rejectExpense(expenseId, userId);

      expect(result.status).toBe('REJECTED');
      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: expenseId },
        data: {
          status: 'REJECTED',
        },
      });
    });
  });

  describe('getProfitLossReport', () => {
    it('should calculate profit correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 50000 },
      });

      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 15000 },
      });

      (prisma.income.groupBy as jest.Mock).mockResolvedValue([
        { source: 'TRIP_FARE', _sum: { amount: 40000 } },
        { source: 'OTHER', _sum: { amount: 10000 } },
      ]);

      (prisma.expense.groupBy as jest.Mock).mockResolvedValue([
        { category: 'FUEL', _sum: { amount: 10000 } },
        { category: 'MAINTENANCE', _sum: { amount: 5000 } },
      ]);

      const result = await financialService.getProfitLossReport(startDate, endDate);

      expect(result.totalIncome).toBe(50000);
      expect(result.totalExpenses).toBe(15000);
      expect(result.netProfit).toBe(35000); // 50000 - 15000
      expect(result.profitMargin).toBe(70); // (35000/50000)*100
    });

    it('should calculate loss correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 10000 },
      });

      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 15000 },
      });

      (prisma.income.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.expense.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await financialService.getProfitLossReport(startDate, endDate);

      expect(result.netProfit).toBe(-5000); // Loss
      expect(result.profitMargin).toBe(-50); // (loss/income)*100
    });

    it('should handle zero income gracefully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 0 },
      });

      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 5000 },
      });

      (prisma.income.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.expense.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await financialService.getProfitLossReport(startDate, endDate);

      expect(result.totalIncome).toBe(0);
      expect(result.netProfit).toBe(-5000);
      expect(result.profitMargin).toBe(0); // Avoid division by zero
    });

    it('should only include approved expenses', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });
      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });
      (prisma.income.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.expense.groupBy as jest.Mock).mockResolvedValue([]);

      await financialService.getProfitLossReport(startDate, endDate);

      expect(prisma.expense.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        })
      );

      expect(prisma.expense.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        })
      );
    });

    it('should group income by source', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 50000 } });
      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });

      (prisma.income.groupBy as jest.Mock).mockResolvedValue([
        { source: 'TRIP_FARE', _sum: { amount: 30000 } },
        { source: 'RENTAL', _sum: { amount: 15000 } },
        { source: 'OTHER', _sum: { amount: 5000 } },
      ]);

      (prisma.expense.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await financialService.getProfitLossReport(startDate, endDate);

      expect(result.incomeBySource.TRIP_FARE).toBe(30000);
      expect(result.incomeBySource.RENTAL).toBe(15000);
      expect(result.incomeBySource.OTHER).toBe(5000);
    });

    it('should group expenses by category', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });
      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 25000 } });
      (prisma.income.groupBy as jest.Mock).mockResolvedValue([]);

      (prisma.expense.groupBy as jest.Mock).mockResolvedValue([
        { category: 'FUEL', _sum: { amount: 10000 } },
        { category: 'MAINTENANCE', _sum: { amount: 8000 } },
        { category: 'INSURANCE', _sum: { amount: 7000 } },
      ]);

      const result = await financialService.getProfitLossReport(startDate, endDate);

      expect(result.expensesByCategory.FUEL).toBe(10000);
      expect(result.expensesByCategory.MAINTENANCE).toBe(8000);
      expect(result.expensesByCategory.INSURANCE).toBe(7000);
    });
  });

  describe('getCashFlowReport', () => {
    it('should calculate cash flow correctly', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');
      const openingBalance = 10000;

      const mockIncome = [
        { amount: 500, date: new Date('2024-06-15') },
        { amount: 750, date: new Date('2024-06-16') },
        { amount: 600, date: new Date('2024-06-15') }, // Same day
      ];

      const mockExpenses = [
        { amount: 200, date: new Date('2024-06-15') },
        { amount: 150, date: new Date('2024-06-17') },
      ];

      (prisma.income.findMany as jest.Mock).mockResolvedValue(mockIncome);
      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      const result = await financialService.getCashFlowReport(startDate, endDate, openingBalance);

      expect(result.openingBalance).toBe(10000);
      expect(result.totalIncome).toBe(1850); // 500 + 750 + 600
      expect(result.totalExpenses).toBe(350); // 200 + 150
      expect(result.closingBalance).toBe(11500); // 10000 + 1850 - 350
    });

    it('should group cash flow by day', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');

      const mockIncome = [
        { amount: 500, date: new Date('2024-06-15') },
        { amount: 300, date: new Date('2024-06-15') }, // Same day - should aggregate
      ];

      const mockExpenses = [
        { amount: 200, date: new Date('2024-06-15') },
      ];

      (prisma.income.findMany as jest.Mock).mockResolvedValue(mockIncome);
      (prisma.expense.findMany as jest.Mock).mockResolvedValue(mockExpenses);

      const result = await financialService.getCashFlowReport(startDate, endDate);

      const june15 = result.dailyCashFlow.find(
        d => d.date.toISOString().startsWith('2024-06-15')
      );

      expect(june15).toBeDefined();
      expect(june15?.income).toBe(800); // 500 + 300
      expect(june15?.expenses).toBe(200);
      expect(june15?.net).toBe(600); // 800 - 200
    });

    it('should sort daily cash flow by date', async () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-06-30');

      const mockIncome = [
        { amount: 500, date: new Date('2024-06-20') },
        { amount: 300, date: new Date('2024-06-10') },
        { amount: 400, date: new Date('2024-06-15') },
      ];

      (prisma.income.findMany as jest.Mock).mockResolvedValue(mockIncome);
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([]);

      const result = await financialService.getCashFlowReport(startDate, endDate);

      expect(result.dailyCashFlow[0].date.toISOString().startsWith('2024-06-10')).toBe(true);
      expect(result.dailyCashFlow[1].date.toISOString().startsWith('2024-06-15')).toBe(true);
      expect(result.dailyCashFlow[2].date.toISOString().startsWith('2024-06-20')).toBe(true);
    });

    it('should default opening balance to zero', async () => {
      (prisma.income.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.expense.findMany as jest.Mock).mockResolvedValue([]);

      const result = await financialService.getCashFlowReport(
        new Date('2024-06-01'),
        new Date('2024-06-30')
      );

      expect(result.openingBalance).toBe(0);
      expect(result.closingBalance).toBe(0);
    });
  });

  describe('getFinancialSummary', () => {
    it('should return complete financial summary', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock P&L data
      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 50000 } });
      (prisma.expense.aggregate as jest.Mock).mockImplementation(async (args: any) => {
        if (args?.where?.status === 'PENDING') {
          return { _sum: { amount: 2500 } };
        }
        return { _sum: { amount: 15000 } };
      });

      (prisma.income.groupBy as jest.Mock).mockResolvedValue([]);
      (prisma.expense.groupBy as jest.Mock).mockResolvedValue([]);

      (prisma.expense.count as jest.Mock).mockResolvedValue(12); // Pending count

      const result = await financialService.getFinancialSummary(startDate, endDate);

      expect(result.totalIncome).toBe(50000);
      expect(result.totalExpenses).toBe(15000);
      expect(result.netProfit).toBe(35000);
      expect(result.pendingExpenses.count).toBe(12);
      expect(result.pendingExpenses.total).toBe(2500);
    });
  });

  describe('getVehicleProfitability', () => {
    it('should calculate vehicle profitability correctly', async () => {
      const vehicleId = 'vehicle-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 25000 },
      });

      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 8000 },
      });

      const result = await financialService.getVehicleProfitability(vehicleId, startDate, endDate);

      expect(result.vehicleId).toBe(vehicleId);
      expect(result.income).toBe(25000);
      expect(result.expenses).toBe(8000);
      expect(result.profit).toBe(17000);
      expect(result.profitMargin).toBe(68); // (17000/25000)*100
    });

    it('should handle unprofitable vehicles', async () => {
      const vehicleId = 'vehicle-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 5000 },
      });

      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 8000 },
      });

      const result = await financialService.getVehicleProfitability(vehicleId, startDate, endDate);

      expect(result.profit).toBe(-3000); // Loss
      expect(result.profitMargin).toBe(-60); // Negative margin
    });

    it('should handle zero income gracefully', async () => {
      const vehicleId = 'vehicle-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 0 },
      });

      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 3000 },
      });

      const result = await financialService.getVehicleProfitability(vehicleId, startDate, endDate);

      expect(result.income).toBe(0);
      expect(result.profit).toBe(-3000);
      expect(result.profitMargin).toBe(0); // Avoid division by zero
    });

    it('should only include approved expenses', async () => {
      const vehicleId = 'vehicle-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (prisma.income.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });
      (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });

      await financialService.getVehicleProfitability(vehicleId, startDate, endDate);

      expect(prisma.expense.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vehicleId,
            status: 'APPROVED',
          }),
        })
      );
    });
  });
});
