import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SubscriptionService, ProrationResult } from '@/services/subscription.service';

/**
 * Unit Tests for SubscriptionService
 * Tests subscription lifecycle, plan management, proration calculations
 */

// Mock invoice generator
jest.mock('@/lib/invoice-generator', () => ({
  invoiceGenerator: {
    generateInvoice: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  dbLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      planConfiguration: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      subscriptionHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback: any) => callback()),
    };

    subscriptionService = new SubscriptionService(mockClient as any);
    jest.clearAllMocks();
  });

  describe('getPlanConfig', () => {
    it('should return database config when available', async () => {
      const mockConfig = {
        plan: 'PREMIUM',
        displayName: 'Premium Plan',
        description: 'Full-featured plan',
        monthlyPrice: 99.99,
        yearlyPrice: 999.90,
        features: ['Unlimited vehicles', 'Priority support'],
        limits: { maxVehicles: -1, maxUsers: -1 },
      };

      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(mockConfig);

      const result = await subscriptionService.getPlanConfig('PREMIUM');

      expect(result.plan).toBe('PREMIUM');
      expect(result.monthlyPrice).toBe(99.99);
      expect(result.features).toContain('Unlimited vehicles');
    });

    it('should fall back to defaults when database config unavailable', async () => {
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await subscriptionService.getPlanConfig('BASIC');

      expect(result.plan).toBe('BASIC');
      expect(result.monthlyPrice).toBe(29.99);
      expect(result.yearlyPrice).toBe(299.90);
      expect(result.limits.maxVehicles).toBe(25);
    });

    it('should return FREE plan config', async () => {
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await subscriptionService.getPlanConfig('FREE');

      expect(result.monthlyPrice).toBe(0);
      expect(result.yearlyPrice).toBe(0);
      expect(result.limits.maxVehicles).toBe(5);
    });
  });

  describe('getSubscriptionDetails', () => {
    it('should return complete subscription details', async () => {
      const tenantId = 'tenant-123';
      const subscriptionEndDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

      const mockTenant = {
        id: tenantId,
        plan: 'PREMIUM',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        subscriptionStartDate: new Date('2024-01-01'),
        subscriptionEndDate,
        isInTrial: false,
        trialEndDate: null,
        autoRenew: true,
        monthlyRevenue: 99.99,
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await subscriptionService.getSubscriptionDetails(tenantId);

      expect(result.tenantId).toBe(tenantId);
      expect(result.currentPlan).toBe('PREMIUM');
      expect(result.status).toBe('ACTIVE');
      expect(result.autoRenew).toBe(true);
      expect(result.canUpgrade).toBe(false); // Already on PREMIUM
      expect(result.canDowngrade).toBe(true);
      expect(result.daysUntilRenewal).toBe(15);
    });

    it('should indicate upgrade capability for non-PREMIUM plans', async () => {
      const mockTenant = {
        id: 'tenant-123',
        plan: 'BASIC',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(),
        isInTrial: false,
        trialEndDate: null,
        autoRenew: true,
        monthlyRevenue: 29.99,
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await subscriptionService.getSubscriptionDetails('tenant-123');

      expect(result.canUpgrade).toBe(true);
      expect(result.canDowngrade).toBe(true);
    });

    it('should indicate no downgrade for FREE plan', async () => {
      const mockTenant = {
        id: 'tenant-123',
        plan: 'FREE',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(),
        isInTrial: false,
        trialEndDate: null,
        autoRenew: true,
        monthlyRevenue: 0,
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await subscriptionService.getSubscriptionDetails('tenant-123');

      expect(result.canUpgrade).toBe(true);
      expect(result.canDowngrade).toBe(false); // Already on FREE
    });

    it('should throw NotFoundError for non-existent tenant', async () => {
      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        subscriptionService.getSubscriptionDetails('invalid-id')
      ).rejects.toThrow('Tenant not found');
    });
  });

  describe('startTrial', () => {
    it('should start trial with default 30 days', async () => {
      const tenantId = 'tenant-123';

      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.startTrial(tenantId);

      const updateCall = (mockClient.tenant.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.plan).toBe('FREE');
      expect(updateCall.data.isInTrial).toBe(true);
      expect(updateCall.data.status).toBe('ACTIVE');

      // Calculate expected trial end date (30 days)
      const trialEndDate = updateCall.data.trialEndDate;
      const daysDiff = Math.ceil((trialEndDate - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it('should start trial with custom duration', async () => {
      const tenantId = 'tenant-123';

      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.startTrial(tenantId, 14); // 14-day trial

      const updateCall = (mockClient.tenant.update as jest.Mock).mock.calls[0][0];
      const trialEndDate = updateCall.data.trialEndDate;
      const daysDiff = Math.ceil((trialEndDate - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(14);
    });

    it('should record trial start in subscription history', async () => {
      const tenantId = 'tenant-123';

      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.startTrial(tenantId);

      expect(mockClient.subscriptionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          changeType: 'TRIAL_START',
          fromPlan: 'FREE',
          toPlan: 'FREE',
          changedBy: 'system',
        }),
      });
    });
  });

  describe('endTrial', () => {
    it('should end trial and convert to specified plan', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'FREE',
        isInTrial: true,
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.endTrial(tenantId, 'BASIC');

      expect(mockClient.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          isInTrial: false,
          plan: 'BASIC',
        },
      });
    });

    it('should default to FREE plan if no conversion plan specified', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'FREE',
        isInTrial: true,
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.endTrial(tenantId);

      expect(mockClient.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          isInTrial: false,
          plan: 'FREE',
        },
      });
    });

    it('should throw error if tenant not in trial', async () => {
      const mockTenant = {
        id: 'tenant-123',
        isInTrial: false,
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(
        subscriptionService.endTrial('tenant-123')
      ).rejects.toThrow('Tenant is not in trial');
    });
  });

  describe('calculateProration', () => {
    it('should calculate proration for mid-cycle upgrade', () => {
      const currentPlan = 'BASIC';
      const newPlan = 'PREMIUM';
      const billingCycle = 'MONTHLY';
      const subscriptionStartDate = new Date('2024-06-01');
      const subscriptionEndDate = new Date('2024-07-01'); // 30 days total

      // Mock current date to be 15 days into the cycle
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-16'));

      const result = subscriptionService.calculateProration(
        currentPlan,
        newPlan,
        billingCycle,
        subscriptionStartDate,
        subscriptionEndDate
      );

      // BASIC monthly: $29.99, PREMIUM monthly: $99.99
      // 15 days remaining out of 30 total
      expect(result.daysRemaining).toBe(15);
      expect(result.totalDays).toBe(30);
      expect(result.unusedAmount).toBeCloseTo(14.995, 2); // (29.99/30)*15
      expect(result.newAmount).toBeCloseTo(49.995, 2); // (99.99/30)*15
      expect(result.creditAmount).toBe(0); // Upgrade - no credit (paying more)

      jest.useRealTimers();
    });

    it('should calculate credit for downgrade', () => {
      const currentPlan = 'PREMIUM';
      const newPlan = 'BASIC';
      const billingCycle = 'MONTHLY';
      const subscriptionStartDate = new Date('2024-06-01');
      const subscriptionEndDate = new Date('2024-07-01');

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-16')); // 15 days remaining

      const result = subscriptionService.calculateProration(
        currentPlan,
        newPlan,
        billingCycle,
        subscriptionStartDate,
        subscriptionEndDate
      );

      // PREMIUM monthly: $99.99, BASIC monthly: $29.99
      expect(result.unusedAmount).toBeCloseTo(49.995, 2); // (99.99/30)*15
      expect(result.newAmount).toBeCloseTo(14.995, 2); // (29.99/30)*15
      expect(result.creditAmount).toBeCloseTo(35.00, 2); // 49.995 - 14.995

      jest.useRealTimers();
    });

    it('should handle yearly billing cycle', () => {
      const currentPlan = 'BASIC';
      const newPlan = 'PREMIUM';
      const billingCycle = 'YEARLY';
      const subscriptionStartDate = new Date('2024-01-01');
      const subscriptionEndDate = new Date('2025-01-01');

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-07-01')); // 184 days remaining

      const result = subscriptionService.calculateProration(
        currentPlan,
        newPlan,
        billingCycle,
        subscriptionStartDate,
        subscriptionEndDate
      );

      // BASIC yearly: $299.90/12 = $24.99/month, PREMIUM yearly: $999.90/12 = $83.33/month
      expect(result.daysRemaining).toBe(184);
      expect(result.totalDays).toBe(366);

      jest.useRealTimers();
    });

    it('should never return negative credit', () => {
      const currentPlan = 'FREE';
      const newPlan = 'PREMIUM';
      const billingCycle = 'MONTHLY';
      const subscriptionStartDate = new Date('2024-06-01');
      const subscriptionEndDate = new Date('2024-07-01');

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-16'));

      const result = subscriptionService.calculateProration(
        currentPlan,
        newPlan,
        billingCycle,
        subscriptionStartDate,
        subscriptionEndDate
      );

      // FREE has $0, upgrading to PREMIUM should have no credit
      expect(result.creditAmount).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('changePlan', () => {
    it('should upgrade plan successfully', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-1';
      const mockTenant = {
        id: tenantId,
        plan: 'BASIC',
        billingCycle: 'MONTHLY',
        subscriptionStartDate: new Date('2024-06-01'),
        subscriptionEndDate: new Date('2024-07-01'),
      };

      const mockInvoice = {
        invoice: { id: 'invoice-1', amount: 99.99 },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      const invoiceGenerator = require('@/lib/invoice-generator').invoiceGenerator;
      (invoiceGenerator.generateInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await subscriptionService.changePlan(
        tenantId,
        { targetPlan: 'PREMIUM' },
        userId
      );

      expect(result.invoice).toBeDefined();
      expect(result.invoice.id).toBe('invoice-1');
      expect(mockClient.subscriptionHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'UPGRADE',
            fromPlan: 'BASIC',
            toPlan: 'PREMIUM',
          }),
        })
      );
    });

    it('should downgrade plan successfully', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-1';
      const mockTenant = {
        id: tenantId,
        plan: 'PREMIUM',
        billingCycle: 'MONTHLY',
        subscriptionStartDate: new Date('2024-06-01'),
        subscriptionEndDate: new Date('2024-07-01'),
      };

      const mockInvoice = {
        invoice: { id: 'invoice-1', amount: 29.99 },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      const invoiceGenerator = require('@/lib/invoice-generator').invoiceGenerator;
      (invoiceGenerator.generateInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await subscriptionService.changePlan(
        tenantId,
        { targetPlan: 'BASIC' },
        userId
      );

      expect(mockClient.subscriptionHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'DOWNGRADE',
            fromPlan: 'PREMIUM',
            toPlan: 'BASIC',
          }),
        })
      );
    });

    it('should reject change to same plan', async () => {
      const mockTenant = {
        id: 'tenant-123',
        plan: 'BASIC',
        billingCycle: 'MONTHLY',
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(
        subscriptionService.changePlan('tenant-123', { targetPlan: 'BASIC' }, 'user-1')
      ).rejects.toThrow('Already on target plan and billing cycle');
    });

    it('should apply proration when requested', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-1';
      const mockTenant = {
        id: tenantId,
        plan: 'BASIC',
        billingCycle: 'MONTHLY',
        subscriptionStartDate: new Date('2024-06-01'),
        subscriptionEndDate: new Date('2024-07-01'),
      };

      const mockInvoice = {
        invoice: { id: 'invoice-1', amount: 50 },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      const invoiceGenerator = require('@/lib/invoice-generator').invoiceGenerator;
      (invoiceGenerator.generateInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-16'));

      const result = await subscriptionService.changePlan(
        tenantId,
        { targetPlan: 'PREMIUM', prorate: true },
        userId
      );

      expect(result.proration).toBeDefined();
      expect(result.proration?.daysRemaining).toBe(15);

      jest.useRealTimers();
    });

    it('should change billing cycle', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'BASIC',
        billingCycle: 'MONTHLY',
        subscriptionStartDate: new Date('2024-06-01'),
        subscriptionEndDate: new Date('2024-07-01'),
      };

      const mockInvoice = {
        invoice: { id: 'invoice-1', amount: 299.90 },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      const invoiceGenerator = require('@/lib/invoice-generator').invoiceGenerator;
      (invoiceGenerator.generateInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      await subscriptionService.changePlan(
        tenantId,
        { targetPlan: 'BASIC', billingCycle: 'YEARLY' },
        'user-1'
      );

      expect(mockClient.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            billingCycle: 'YEARLY',
          }),
        })
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-1';
      const mockTenant = {
        id: tenantId,
        plan: 'PREMIUM',
        subscriptionEndDate: new Date('2024-07-01'),
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.cancelSubscription(
        tenantId,
        { immediate: true, reason: 'Too expensive' },
        userId
      );

      expect(mockClient.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: expect.objectContaining({
          status: 'CANCELED',
          plan: 'FREE',
          autoRenew: false,
          cancelReason: 'Too expensive',
        }),
      });
    });

    it('should cancel at end of billing period', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-1';
      const mockTenant = {
        id: tenantId,
        plan: 'PREMIUM',
        subscriptionEndDate: new Date('2024-07-01'),
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.cancelSubscription(
        tenantId,
        { immediate: false, reason: 'Switching providers' },
        userId
      );

      expect(mockClient.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: expect.objectContaining({
          autoRenew: false,
          cancelReason: 'Switching providers',
        }),
      });

      // Should not change status or plan immediately
      const updateCall = (mockClient.tenant.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.status).toBeUndefined();
      expect(updateCall.data.plan).toBeUndefined();
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate canceled subscription', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-1';
      const mockTenant = {
        id: tenantId,
        plan: 'FREE',
        status: 'CANCELED',
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockClient.tenant.update as jest.Mock).mockResolvedValue({});
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      await subscriptionService.reactivateSubscription(tenantId, 'PREMIUM', userId);

      expect(mockClient.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: expect.objectContaining({
          status: 'ACTIVE',
          plan: 'PREMIUM',
          autoRenew: true,
          canceledAt: null,
          cancelReason: null,
          monthlyRevenue: 99.99,
        }),
      });
    });

    it('should throw error if subscription not canceled', async () => {
      const mockTenant = {
        id: 'tenant-123',
        status: 'ACTIVE',
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(
        subscriptionService.reactivateSubscription('tenant-123', 'BASIC', 'user-1')
      ).rejects.toThrow('Subscription is not canceled');
    });
  });

  describe('renewSubscription', () => {
    it('should renew subscription successfully', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'PREMIUM',
        billingCycle: 'MONTHLY',
        autoRenew: true,
      };

      const mockInvoice = {
        invoice: { id: 'invoice-1', amount: 99.99 },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      const invoiceGenerator = require('@/lib/invoice-generator').invoiceGenerator;
      (invoiceGenerator.generateInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await subscriptionService.renewSubscription(tenantId);

      expect(result.invoice).toBeDefined();
      expect(result.invoice.id).toBe('invoice-1');
      expect(mockClient.subscriptionHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            changeType: 'RENEWAL',
            fromPlan: 'PREMIUM',
            toPlan: 'PREMIUM',
            changedBy: 'system',
          }),
        })
      );
    });

    it('should throw error if autoRenew is disabled', async () => {
      const mockTenant = {
        id: 'tenant-123',
        autoRenew: false,
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(
        subscriptionService.renewSubscription('tenant-123')
      ).rejects.toThrow('Auto-renewal is disabled');
    });

    it('should use yearly price for yearly billing cycle', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'PREMIUM',
        billingCycle: 'YEARLY',
        autoRenew: true,
      };

      const mockInvoice = {
        invoice: { id: 'invoice-1', amount: 999.90 },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);
      (mockClient.subscriptionHistory.create as jest.Mock).mockResolvedValue({});

      const invoiceGenerator = require('@/lib/invoice-generator').invoiceGenerator;
      (invoiceGenerator.generateInvoice as jest.Mock).mockResolvedValue(mockInvoice);

      await subscriptionService.renewSubscription(tenantId);

      expect(invoiceGenerator.generateInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 999.90, // Yearly price
          billingPeriod: 'Yearly',
        })
      );
    });
  });

  describe('validatePlanLimits', () => {
    it('should pass validation when within limits', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'BASIC',
        _count: {
          vehicles: 10,
          users: 5,
          drivers: 20,
        },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await subscriptionService.validatePlanLimits(tenantId);

      // BASIC limits: 25 vehicles, 10 users, 50 drivers
      expect(result.withinLimits).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect vehicle limit violation', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'BASIC',
        _count: {
          vehicles: 30, // Over limit of 25
          users: 5,
          drivers: 20,
        },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await subscriptionService.validatePlanLimits(tenantId);

      expect(result.withinLimits).toBe(false);
      expect(result.violations).toContain('Vehicle limit exceeded: 30/25');
    });

    it('should detect multiple violations', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'FREE',
        _count: {
          vehicles: 8, // Over limit of 5
          users: 5, // Over limit of 3
          drivers: 15, // Over limit of 10
        },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await subscriptionService.validatePlanLimits(tenantId);

      expect(result.withinLimits).toBe(false);
      expect(result.violations).toHaveLength(3);
      expect(result.violations).toContain('Vehicle limit exceeded: 8/5');
      expect(result.violations).toContain('User limit exceeded: 5/3');
      expect(result.violations).toContain('Driver limit exceeded: 15/10');
    });

    it('should allow unlimited for PREMIUM plan', async () => {
      const tenantId = 'tenant-123';
      const mockTenant = {
        id: tenantId,
        plan: 'PREMIUM',
        _count: {
          vehicles: 1000,
          users: 500,
          drivers: 2000,
        },
      };

      (mockClient.tenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (mockClient.planConfiguration.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await subscriptionService.validatePlanLimits(tenantId);

      // PREMIUM has -1 (unlimited) for all limits
      expect(result.withinLimits).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });
});
