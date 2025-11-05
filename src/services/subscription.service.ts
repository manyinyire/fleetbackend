/**
 * Subscription Service Layer
 *
 * Centralized business logic for subscription management including:
 * - Subscription lifecycle (trials, upgrades, downgrades, cancellations)
 * - Prorated billing calculations
 * - Plan configuration management
 * - Subscription history tracking
 * - Payment coordination
 */

import { PrismaClient, SubscriptionPlan, BillingCycle, SubscriptionChangeType, TenantStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { dbLogger } from '@/lib/logger';
import { NotFoundError, ValidationError, handlePrismaError } from '@/lib/errors';
import { invoiceGenerator } from '@/lib/invoice-generator';

// ============================================
// TYPES AND INTERFACES
// ============================================

export interface PlanConfig {
  plan: SubscriptionPlan;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    maxVehicles: number;
    maxUsers: number;
    maxDrivers: number;
    [key: string]: any;
  };
}

export interface SubscriptionDetails {
  tenantId: string;
  currentPlan: SubscriptionPlan;
  billingCycle: BillingCycle;
  status: TenantStatus;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  isInTrial: boolean;
  trialEndDate: Date | null;
  autoRenew: boolean;
  monthlyRevenue: number;
  daysUntilRenewal: number | null;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export interface UpgradeOptions {
  targetPlan: SubscriptionPlan;
  billingCycle?: BillingCycle;
  prorate?: boolean;
  effectiveDate?: Date;
  reason?: string;
}

export interface CancellationOptions {
  immediate?: boolean;
  reason?: string;
  feedback?: string;
}

export interface ProrationResult {
  unusedAmount: number;
  newAmount: number;
  creditAmount: number;
  daysRemaining: number;
  totalDays: number;
}

// ============================================
// DEFAULT PLAN CONFIGURATIONS
// ============================================

const DEFAULT_PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    plan: 'FREE',
    displayName: 'Free Plan',
    description: 'Perfect for getting started with basic fleet management',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 5 vehicles',
      'Basic reporting',
      'Email support',
      'Driver management',
      'Basic remittance tracking'
    ],
    limits: {
      maxVehicles: 5,
      maxUsers: 3,
      maxDrivers: 10,
      apiAccess: false,
      advancedReports: false
    }
  },
  BASIC: {
    plan: 'BASIC',
    displayName: 'Basic Plan',
    description: 'Ideal for small to medium fleets',
    monthlyPrice: 29.99,
    yearlyPrice: 299.90, // ~17% discount
    features: [
      'Up to 25 vehicles',
      'Advanced reporting',
      'Priority email support',
      'API access',
      'Contract management',
      'Maintenance tracking',
      'Custom branding'
    ],
    limits: {
      maxVehicles: 25,
      maxUsers: 10,
      maxDrivers: 50,
      apiAccess: true,
      advancedReports: true
    }
  },
  PREMIUM: {
    plan: 'PREMIUM',
    displayName: 'Premium Plan',
    description: 'Complete solution for large fleet operations',
    monthlyPrice: 99.99,
    yearlyPrice: 999.90, // ~17% discount
    features: [
      'Unlimited vehicles',
      'Custom reporting',
      '24/7 priority support',
      'Full API access',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced analytics',
      'White-label options'
    ],
    limits: {
      maxVehicles: -1, // unlimited
      maxUsers: -1,
      maxDrivers: -1,
      apiAccess: true,
      advancedReports: true,
      customIntegrations: true
    }
  }
};

// ============================================
// SUBSCRIPTION SERVICE CLASS
// ============================================

export class SubscriptionService {
  /**
   * Get plan configuration from database or defaults
   */
  async getPlanConfig(plan: SubscriptionPlan): Promise<PlanConfig> {
    try {
      const config = await prisma.planConfiguration.findUnique({
        where: { plan }
      });

      if (config) {
        return {
          plan: config.plan,
          displayName: config.displayName,
          description: config.description || '',
          monthlyPrice: Number(config.monthlyPrice),
          yearlyPrice: Number(config.yearlyPrice),
          features: config.features as string[],
          limits: config.limits as any
        };
      }

      return DEFAULT_PLAN_CONFIGS[plan];
    } catch (error) {
      dbLogger.warn({ err: error, plan }, 'Failed to fetch plan config, using defaults');
      return DEFAULT_PLAN_CONFIGS[plan];
    }
  }

  /**
   * Get all available plans
   */
  async getAllPlans(): Promise<PlanConfig[]> {
    return Promise.all([
      this.getPlanConfig('FREE'),
      this.getPlanConfig('BASIC'),
      this.getPlanConfig('PREMIUM')
    ]);
  }

  /**
   * Get detailed subscription information for a tenant
   */
  async getSubscriptionDetails(tenantId: string): Promise<SubscriptionDetails> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    const now = new Date();
    const daysUntilRenewal = tenant.subscriptionEndDate
      ? Math.ceil((tenant.subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      tenantId: tenant.id,
      currentPlan: tenant.plan,
      billingCycle: tenant.billingCycle,
      status: tenant.status,
      subscriptionStartDate: tenant.subscriptionStartDate,
      subscriptionEndDate: tenant.subscriptionEndDate,
      isInTrial: tenant.isInTrial,
      trialEndDate: tenant.trialEndDate,
      autoRenew: tenant.autoRenew,
      monthlyRevenue: Number(tenant.monthlyRevenue),
      daysUntilRenewal,
      canUpgrade: tenant.plan !== 'PREMIUM',
      canDowngrade: tenant.plan !== 'FREE'
    };
  }

  /**
   * Start a trial subscription for a new tenant
   */
  async startTrial(tenantId: string, trialDays: number = 30): Promise<void> {
    try {
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'FREE',
          isInTrial: true,
          trialStartDate: now,
          trialEndDate,
          subscriptionStartDate: now,
          subscriptionEndDate: trialEndDate,
          status: 'ACTIVE'
        }
      });

      // Record in history
      await prisma.subscriptionHistory.create({
        data: {
          tenantId,
          fromPlan: 'FREE',
          toPlan: 'FREE',
          changeType: 'TRIAL_START',
          effectiveDate: now,
          changedBy: 'system',
          metadata: { trialDays }
        }
      });

      dbLogger.info({ tenantId, trialDays }, 'Trial subscription started');
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to start trial');
      throw handlePrismaError(error);
    }
  }

  /**
   * End trial and convert to paid plan or downgrade to free
   */
  async endTrial(tenantId: string, convertToPlan?: SubscriptionPlan): Promise<void> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant || !tenant.isInTrial) {
        throw new ValidationError('Tenant is not in trial');
      }

      const targetPlan = convertToPlan || 'FREE';
      const now = new Date();

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          isInTrial: false,
          plan: targetPlan
        }
      });

      await prisma.subscriptionHistory.create({
        data: {
          tenantId,
          fromPlan: tenant.plan,
          toPlan: targetPlan,
          changeType: 'TRIAL_END',
          effectiveDate: now,
          changedBy: 'system',
          metadata: { converted: !!convertToPlan }
        }
      });

      dbLogger.info({ tenantId, targetPlan }, 'Trial ended');
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to end trial');
      throw handlePrismaError(error);
    }
  }

  /**
   * Calculate prorated amount for mid-cycle plan changes
   */
  calculateProration(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    billingCycle: BillingCycle,
    subscriptionStartDate: Date,
    subscriptionEndDate: Date
  ): ProrationResult {
    const currentConfig = DEFAULT_PLAN_CONFIGS[currentPlan];
    const newConfig = DEFAULT_PLAN_CONFIGS[newPlan];

    const currentPrice = billingCycle === 'MONTHLY'
      ? currentConfig.monthlyPrice
      : currentConfig.yearlyPrice / 12;

    const newPrice = billingCycle === 'MONTHLY'
      ? newConfig.monthlyPrice
      : newConfig.yearlyPrice / 12;

    const now = new Date();
    const totalDays = Math.ceil(
      (subscriptionEndDate.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.ceil(
      (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const unusedAmount = (currentPrice / totalDays) * daysRemaining;
    const newAmount = (newPrice / totalDays) * daysRemaining;
    const creditAmount = Math.max(0, unusedAmount - newAmount);

    return {
      unusedAmount: Number(unusedAmount.toFixed(2)),
      newAmount: Number(newAmount.toFixed(2)),
      creditAmount: Number(creditAmount.toFixed(2)),
      daysRemaining,
      totalDays
    };
  }

  /**
   * Upgrade or downgrade a subscription
   */
  async changePlan(
    tenantId: string,
    options: UpgradeOptions,
    userId: string
  ): Promise<{ invoice: any; proration: ProrationResult | null }> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      const { targetPlan, billingCycle, prorate = true, effectiveDate, reason } = options;

      // Validate plan change
      if (tenant.plan === targetPlan && tenant.billingCycle === (billingCycle || tenant.billingCycle)) {
        throw new ValidationError('Already on target plan and billing cycle');
      }

      const isUpgrade = this.isUpgrade(tenant.plan, targetPlan);
      const changeType: SubscriptionChangeType = isUpgrade ? 'UPGRADE' : 'DOWNGRADE';
      const effectiveBillingCycle = billingCycle || tenant.billingCycle;

      // Calculate proration if applicable
      let prorationResult: ProrationResult | null = null;
      if (prorate && tenant.subscriptionStartDate && tenant.subscriptionEndDate) {
        prorationResult = this.calculateProration(
          tenant.plan,
          targetPlan,
          effectiveBillingCycle,
          tenant.subscriptionStartDate,
          tenant.subscriptionEndDate
        );
      }

      // Get new plan pricing
      const newConfig = await this.getPlanConfig(targetPlan);
      const newPrice = effectiveBillingCycle === 'MONTHLY'
        ? newConfig.monthlyPrice
        : newConfig.yearlyPrice;

      // Calculate invoice amount (with proration if applicable)
      const invoiceAmount = prorationResult
        ? Math.max(0, newPrice - prorationResult.creditAmount)
        : newPrice;

      // Create invoice for the plan change
      const invoice = await invoiceGenerator.generateInvoice({
        tenantId,
        type: isUpgrade ? 'UPGRADE' : 'RENEWAL',
        plan: targetPlan,
        amount: invoiceAmount,
        description: `${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${newConfig.displayName}${prorationResult ? ' (prorated)' : ''}`,
        billingPeriod: effectiveBillingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'
      });

      // Record subscription change in history
      await prisma.subscriptionHistory.create({
        data: {
          tenantId,
          fromPlan: tenant.plan,
          toPlan: targetPlan,
          fromCycle: tenant.billingCycle,
          toCycle: effectiveBillingCycle,
          changeType,
          changeReason: reason,
          proratedAmount: prorationResult?.creditAmount || 0,
          effectiveDate: effectiveDate || new Date(),
          changedBy: userId,
          metadata: { prorationResult, invoiceId: invoice.invoice.id }
        }
      });

      // Update tenant (plan will be updated upon payment)
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          billingCycle: effectiveBillingCycle
        }
      });

      dbLogger.info(
        { tenantId, fromPlan: tenant.plan, toPlan: targetPlan, changeType },
        'Subscription plan change initiated'
      );

      return { invoice: invoice.invoice, proration: prorationResult };
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to change plan');
      throw handlePrismaError(error);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    tenantId: string,
    options: CancellationOptions,
    userId: string
  ): Promise<void> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      const { immediate = false, reason, feedback } = options;
      const now = new Date();

      if (immediate) {
        // Immediate cancellation
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            status: 'CANCELED',
            plan: 'FREE',
            canceledAt: now,
            cancelReason: reason,
            autoRenew: false,
            subscriptionEndDate: now
          }
        });
      } else {
        // Cancel at end of billing period
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            autoRenew: false,
            canceledAt: now,
            cancelReason: reason
          }
        });
      }

      // Record in history
      await prisma.subscriptionHistory.create({
        data: {
          tenantId,
          fromPlan: tenant.plan,
          toPlan: immediate ? 'FREE' : tenant.plan,
          changeType: 'CANCELLATION',
          changeReason: reason,
          effectiveDate: immediate ? now : (tenant.subscriptionEndDate || now),
          changedBy: userId,
          metadata: { immediate, feedback }
        }
      });

      dbLogger.info(
        { tenantId, immediate, reason },
        'Subscription canceled'
      );
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to cancel subscription');
      throw handlePrismaError(error);
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(tenantId: string, plan: SubscriptionPlan, userId: string): Promise<void> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      if (tenant.status !== 'CANCELED') {
        throw new ValidationError('Subscription is not canceled');
      }

      const now = new Date();
      const config = await this.getPlanConfig(plan);
      const monthlyPrice = config.monthlyPrice;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: 'ACTIVE',
          plan,
          autoRenew: true,
          canceledAt: null,
          cancelReason: null,
          monthlyRevenue: monthlyPrice
        }
      });

      await prisma.subscriptionHistory.create({
        data: {
          tenantId,
          fromPlan: tenant.plan,
          toPlan: plan,
          changeType: 'REACTIVATION',
          effectiveDate: now,
          changedBy: userId
        }
      });

      dbLogger.info({ tenantId, plan }, 'Subscription reactivated');
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to reactivate subscription');
      throw handlePrismaError(error);
    }
  }

  /**
   * Process subscription renewal
   */
  async renewSubscription(tenantId: string): Promise<{ invoice: any }> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      if (!tenant.autoRenew) {
        throw new ValidationError('Auto-renewal is disabled');
      }

      const config = await this.getPlanConfig(tenant.plan);
      const amount = tenant.billingCycle === 'MONTHLY'
        ? config.monthlyPrice
        : config.yearlyPrice;

      // Create renewal invoice
      const invoice = await invoiceGenerator.generateInvoice({
        tenantId,
        type: 'RENEWAL',
        plan: tenant.plan,
        amount,
        billingPeriod: tenant.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'
      });

      // Record in history
      await prisma.subscriptionHistory.create({
        data: {
          tenantId,
          fromPlan: tenant.plan,
          toPlan: tenant.plan,
          changeType: 'RENEWAL',
          effectiveDate: new Date(),
          changedBy: 'system',
          metadata: { invoiceId: invoice.invoice.id }
        }
      });

      dbLogger.info({ tenantId, plan: tenant.plan }, 'Subscription renewal processed');

      return { invoice: invoice.invoice };
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to renew subscription');
      throw handlePrismaError(error);
    }
  }

  /**
   * Get subscription history for a tenant
   */
  async getSubscriptionHistory(tenantId: string, limit: number = 50) {
    try {
      const history = await prisma.subscriptionHistory.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return history;
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to get subscription history');
      throw handlePrismaError(error);
    }
  }

  /**
   * Check if plan change is an upgrade
   */
  private isUpgrade(fromPlan: SubscriptionPlan, toPlan: SubscriptionPlan): boolean {
    const planOrder: Record<SubscriptionPlan, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2
    };

    return planOrder[toPlan] > planOrder[fromPlan];
  }

  /**
   * Validate tenant against plan limits
   */
  async validatePlanLimits(tenantId: string): Promise<{
    withinLimits: boolean;
    violations: string[];
  }> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          _count: {
            select: {
              vehicles: true,
              users: true,
              drivers: true
            }
          }
        }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      const config = await this.getPlanConfig(tenant.plan);
      const violations: string[] = [];

      // Check vehicle limit
      if (config.limits.maxVehicles !== -1 && tenant._count.vehicles > config.limits.maxVehicles) {
        violations.push(`Vehicle limit exceeded: ${tenant._count.vehicles}/${config.limits.maxVehicles}`);
      }

      // Check user limit
      if (config.limits.maxUsers !== -1 && tenant._count.users > config.limits.maxUsers) {
        violations.push(`User limit exceeded: ${tenant._count.users}/${config.limits.maxUsers}`);
      }

      // Check driver limit
      if (config.limits.maxDrivers !== -1 && tenant._count.drivers > config.limits.maxDrivers) {
        violations.push(`Driver limit exceeded: ${tenant._count.drivers}/${config.limits.maxDrivers}`);
      }

      return {
        withinLimits: violations.length === 0,
        violations
      };
    } catch (error) {
      dbLogger.error({ err: error, tenantId }, 'Failed to validate plan limits');
      throw handlePrismaError(error);
    }
  }

  /**
   * Initialize default plan configurations in database
   */
  async seedPlanConfigurations(): Promise<void> {
    try {
      for (const [plan, config] of Object.entries(DEFAULT_PLAN_CONFIGS)) {
        await prisma.planConfiguration.upsert({
          where: { plan: plan as SubscriptionPlan },
          update: {
            displayName: config.displayName,
            description: config.description,
            monthlyPrice: config.monthlyPrice,
            yearlyPrice: config.yearlyPrice,
            features: config.features,
            limits: config.limits
          },
          create: {
            plan: plan as SubscriptionPlan,
            displayName: config.displayName,
            description: config.description,
            monthlyPrice: config.monthlyPrice,
            yearlyPrice: config.yearlyPrice,
            features: config.features,
            limits: config.limits,
            sortOrder: plan === 'FREE' ? 0 : plan === 'BASIC' ? 1 : 2
          }
        });
      }

      dbLogger.info('Plan configurations seeded successfully');
    } catch (error) {
      dbLogger.error({ err: error }, 'Failed to seed plan configurations');
      throw handlePrismaError(error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
