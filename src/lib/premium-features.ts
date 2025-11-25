import { SubscriptionPlan } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Premium Feature Definitions
 * This file defines all premium features and their limits per subscription plan
 */

export interface PlanLimits {
  // Core Limits
  vehicles: number | "unlimited";
  drivers: number | "unlimited";
  adminUsers: number | "unlimited";
  totalUsers: number | "unlimited";

  // Data Retention
  dataRetentionMonths: number | "unlimited";
  auditLogRetentionDays: number | "unlimited";

  // Reporting
  advancedReporting: boolean;
  customReporting: boolean;
  reportExport: boolean;
  scheduledReports: boolean;

  // API Access
  apiAccess: boolean;
  apiRequestsPerDay: number | "unlimited";
  webhookAccess: boolean;

  // Financial Features
  expenseApprovalWorkflow: boolean;
  budgetTracking: boolean;
  financialForecasting: boolean;
  multiCurrency: boolean;
  taxReporting: boolean;

  // Maintenance Features
  predictiveMaintenance: boolean;
  maintenanceScheduling: boolean;
  vendorManagement: boolean;

  // Communication
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  customEmailTemplates: boolean;

  // Security
  twoFactorAuthRequired: boolean;
  ipWhitelisting: boolean;
  sessionLimits: boolean;
  advancedAuditLogs: boolean;

  // Branding & Customization
  customBranding: boolean;
  whiteLabeling: boolean;
  customDomain: boolean;

  // Support
  supportLevel: "email" | "priority" | "24/7";
  supportResponseTime: string;
  dedicatedAccountManager: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  FREE: {
    // Core Limits
    vehicles: 5,
    drivers: 10,
    adminUsers: 1,
    totalUsers: 2,

    // Data Retention
    dataRetentionMonths: 3,
    auditLogRetentionDays: 7,

    // Reporting
    advancedReporting: false,
    customReporting: false,
    reportExport: false,
    scheduledReports: false,

    // API Access
    apiAccess: false,
    apiRequestsPerDay: 0,
    webhookAccess: false,

    // Financial Features
    expenseApprovalWorkflow: true,
    budgetTracking: false,
    financialForecasting: false,
    multiCurrency: false,
    taxReporting: false,

    // Maintenance Features
    predictiveMaintenance: false,
    maintenanceScheduling: true,
    vendorManagement: false,

    // Communication
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
    customEmailTemplates: false,

    // Security
    twoFactorAuthRequired: false,
    ipWhitelisting: false,
    sessionLimits: false,
    advancedAuditLogs: false,

    // Branding & Customization
    customBranding: false,
    whiteLabeling: false,
    customDomain: false,

    // Support
    supportLevel: "email",
    supportResponseTime: "48-72 hours",
    dedicatedAccountManager: false,
  },

  BASIC: {
    // Core Limits
    vehicles: 25,
    drivers: 50,
    adminUsers: 3,
    totalUsers: 10,

    // Data Retention
    dataRetentionMonths: 12,
    auditLogRetentionDays: 90,

    // Reporting
    advancedReporting: true,
    customReporting: false,
    reportExport: true,
    scheduledReports: false,

    // API Access
    apiAccess: true,
    apiRequestsPerDay: 1000,
    webhookAccess: false,

    // Financial Features
    expenseApprovalWorkflow: true,
    budgetTracking: true,
    financialForecasting: false,
    multiCurrency: false,
    taxReporting: false,

    // Maintenance Features
    predictiveMaintenance: false,
    maintenanceScheduling: true,
    vendorManagement: true,

    // Communication
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
    customEmailTemplates: true,

    // Security
    twoFactorAuthRequired: false,
    ipWhitelisting: false,
    sessionLimits: true,
    advancedAuditLogs: true,

    // Branding & Customization
    customBranding: true,
    whiteLabeling: false,
    customDomain: false,

    // Support
    supportLevel: "priority",
    supportResponseTime: "12-24 hours",
    dedicatedAccountManager: false,
  },

  PREMIUM: {
    // Core Limits
    vehicles: "unlimited",
    drivers: "unlimited",
    adminUsers: "unlimited",
    totalUsers: "unlimited",

    // Data Retention
    dataRetentionMonths: "unlimited",
    auditLogRetentionDays: "unlimited",

    // Reporting
    advancedReporting: true,
    customReporting: true,
    reportExport: true,
    scheduledReports: true,

    // API Access
    apiAccess: true,
    apiRequestsPerDay: "unlimited",
    webhookAccess: true,

    // Financial Features
    expenseApprovalWorkflow: true,
    budgetTracking: true,
    financialForecasting: true,
    multiCurrency: true,
    taxReporting: true,

    // Maintenance Features
    predictiveMaintenance: true,
    maintenanceScheduling: true,
    vendorManagement: true,

    // Communication
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    customEmailTemplates: true,

    // Security
    twoFactorAuthRequired: true,
    ipWhitelisting: true,
    sessionLimits: true,
    advancedAuditLogs: true,

    // Branding & Customization
    customBranding: true,
    whiteLabeling: true,
    customDomain: true,

    // Support
    supportLevel: "24/7",
    supportResponseTime: "1-4 hours",
    dedicatedAccountManager: true,
  },
};

export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number | "unlimited";
  suggestedPlan?: SubscriptionPlan;
  upgradeMessage?: string;
}

/**
 * Premium Feature Service
 * Handles all premium feature checks and limits
 */
export class PremiumFeatureService {
  /**
   * Get plan limits for a specific plan
   * First checks database for custom configuration, falls back to defaults
   */
  static async getPlanLimits(plan: SubscriptionPlan): Promise<PlanLimits> {
    try {
      // Try to get configuration from database
      const planConfig = await prisma.planConfiguration.findUnique({
        where: { plan }
      });

      // If database config exists and has limits, merge with defaults
      if (planConfig?.limits && typeof planConfig.limits === 'object') {
        return {
          ...PLAN_LIMITS[plan],
          ...(planConfig.limits as Partial<PlanLimits>)
        };
      }
    } catch (error) {
      apiLogger.error({ err: error }, 'Error fetching plan configuration from database:');
    }

    // Fall back to hardcoded defaults
    return PLAN_LIMITS[plan];
  }

  /**
   * Get plan limits synchronously (for backwards compatibility)
   * Note: This only returns hardcoded limits and does not check database
   */
  static getPlanLimitsSync(plan: SubscriptionPlan): PlanLimits {
    return PLAN_LIMITS[plan];
  }

  /**
   * Get tenant's current plan and limits
   */
  static async getTenantPlanLimits(tenantId: string): Promise<PlanLimits> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    return await this.getPlanLimits(tenant.plan);
  }

  /**
   * Check if tenant can add more vehicles
   */
  static async canAddVehicle(tenantId: string): Promise<FeatureCheckResult> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        _count: {
          select: { vehicles: true }
        }
      },
    });

    if (!tenant) {
      return { allowed: false, reason: "Tenant not found" };
    }

    const limits = await this.getPlanLimits(tenant.plan);
    const currentCount = tenant._count.vehicles;

    if (limits.vehicles === "unlimited") {
      return { allowed: true, currentUsage: currentCount, limit: "unlimited" };
    }

    if (currentCount >= limits.vehicles) {
      const nextPlan = this.getNextPlan(tenant.plan);
      return {
        allowed: false,
        reason: `Vehicle limit reached (${limits.vehicles})`,
        currentUsage: currentCount,
        limit: limits.vehicles,
        suggestedPlan: nextPlan,
        upgradeMessage: this.getUpgradeMessage("vehicles", nextPlan),
      };
    }

    return {
      allowed: true,
      currentUsage: currentCount,
      limit: limits.vehicles
    };
  }

  /**
   * Check if tenant can add more drivers
   */
  static async canAddDriver(tenantId: string): Promise<FeatureCheckResult> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        _count: {
          select: { drivers: true }
        }
      },
    });

    if (!tenant) {
      return { allowed: false, reason: "Tenant not found" };
    }

    const limits = await this.getPlanLimits(tenant.plan);
    const currentCount = tenant._count.drivers;

    if (limits.drivers === "unlimited") {
      return { allowed: true, currentUsage: currentCount, limit: "unlimited" };
    }

    if (currentCount >= limits.drivers) {
      const nextPlan = this.getNextPlan(tenant.plan);
      return {
        allowed: false,
        reason: `Driver limit reached (${limits.drivers})`,
        currentUsage: currentCount,
        limit: limits.drivers,
        suggestedPlan: nextPlan,
        upgradeMessage: this.getUpgradeMessage("drivers", nextPlan),
      };
    }

    return {
      allowed: true,
      currentUsage: currentCount,
      limit: limits.drivers
    };
  }

  /**
   * Check if tenant can add more users
   */
  static async canAddUser(tenantId: string, isAdmin: boolean = false): Promise<FeatureCheckResult> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        users: {
          select: {
            role: true,
          }
        }
      },
    });

    if (!tenant) {
      return { allowed: false, reason: "Tenant not found" };
    }

    const limits = await this.getPlanLimits(tenant.plan);
    const currentUserCount = tenant.users.length;
    const currentAdminCount = tenant.users.filter(u =>
      u.role?.includes('TENANT_ADMIN') || u.role?.includes('admin')
    ).length;

    // Check total user limit
    if (limits.totalUsers !== "unlimited" && currentUserCount >= limits.totalUsers) {
      const nextPlan = this.getNextPlan(tenant.plan);
      return {
        allowed: false,
        reason: `User limit reached (${limits.totalUsers})`,
        currentUsage: currentUserCount,
        limit: limits.totalUsers,
        suggestedPlan: nextPlan,
        upgradeMessage: this.getUpgradeMessage("users", nextPlan),
      };
    }

    // Check admin user limit if adding an admin
    if (isAdmin && limits.adminUsers !== "unlimited" && currentAdminCount >= limits.adminUsers) {
      const nextPlan = this.getNextPlan(tenant.plan);
      return {
        allowed: false,
        reason: `Admin user limit reached (${limits.adminUsers})`,
        currentUsage: currentAdminCount,
        limit: limits.adminUsers,
        suggestedPlan: nextPlan,
        upgradeMessage: this.getUpgradeMessage("admin users", nextPlan),
      };
    }

    return {
      allowed: true,
      currentUsage: isAdmin ? currentAdminCount : currentUserCount,
      limit: isAdmin ? limits.adminUsers : limits.totalUsers
    };
  }

  /**
   * Check if tenant has access to a specific feature
   */
  static async hasFeatureAccess(
    tenantId: string,
    feature: keyof PlanLimits
  ): Promise<FeatureCheckResult> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      return { allowed: false, reason: "Tenant not found" };
    }

    const limits = await this.getPlanLimits(tenant.plan);
    const hasAccess = limits[feature];

    if (typeof hasAccess === 'boolean' && !hasAccess) {
      const nextPlan = this.getNextPlan(tenant.plan);
      return {
        allowed: false,
        reason: `This feature is not available on your ${tenant.plan} plan`,
        suggestedPlan: nextPlan,
        upgradeMessage: this.getUpgradeMessage(feature as string, nextPlan),
      };
    }

    return { allowed: true };
  }

  /**
   * Check API rate limit
   */
  static async checkApiRateLimit(tenantId: string): Promise<FeatureCheckResult> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      return { allowed: false, reason: "Tenant not found" };
    }

    const limits = await this.getPlanLimits(tenant.plan);

    if (!limits.apiAccess) {
      const nextPlan = this.getNextPlan(tenant.plan);
      return {
        allowed: false,
        reason: "API access is not available on your plan",
        suggestedPlan: nextPlan,
        upgradeMessage: this.getUpgradeMessage("API access", nextPlan),
      };
    }

    // TODO: Implement actual rate limiting with Redis or similar
    // For now, just check if they have API access
    return {
      allowed: true,
      limit: limits.apiRequestsPerDay
    };
  }

  /**
   * Get suggested upgrade plan
   */
  private static getNextPlan(currentPlan: SubscriptionPlan): SubscriptionPlan {
    const planOrder: SubscriptionPlan[] = ['FREE', 'BASIC', 'PREMIUM'];
    const currentIndex = planOrder.indexOf(currentPlan);

    if (currentIndex < planOrder.length - 1) {
      return planOrder[currentIndex + 1];
    }

    return currentPlan; // Already on highest plan
  }

  /**
   * Generate upgrade message
   */
  private static getUpgradeMessage(feature: string, suggestedPlan: SubscriptionPlan): string {
    const planPricing = {
      FREE: { price: "$0", name: "Free" },
      BASIC: { price: "$29.99/month", name: "Basic" },
      PREMIUM: { price: "$99.99/month", name: "Premium" },
    };

    const plan = planPricing[suggestedPlan];
    return `Upgrade to ${plan.name} (${plan.price}) to unlock ${feature} and other advanced features.`;
  }

  /**
   * Get feature usage summary for a tenant
   */
  static async getUsageSummary(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        plan: true,
        _count: {
          select: {
            vehicles: true,
            drivers: true,
            users: true,
          }
        },
        users: {
          select: { role: true }
        }
      },
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const limits = await this.getPlanLimits(tenant.plan);
    const adminCount = tenant.users.filter(u =>
      u.role?.includes('TENANT_ADMIN') || u.role?.includes('admin')
    ).length;

    return {
      plan: tenant.plan,
      limits,
      usage: {
        vehicles: {
          current: tenant._count.vehicles,
          limit: limits.vehicles,
          percentage: limits.vehicles === "unlimited"
            ? 0
            : Math.round((tenant._count.vehicles / limits.vehicles) * 100),
        },
        drivers: {
          current: tenant._count.drivers,
          limit: limits.drivers,
          percentage: limits.drivers === "unlimited"
            ? 0
            : Math.round((tenant._count.drivers / limits.drivers) * 100),
        },
        users: {
          current: tenant._count.users,
          limit: limits.totalUsers,
          percentage: limits.totalUsers === "unlimited"
            ? 0
            : Math.round((tenant._count.users / (limits.totalUsers as number)) * 100),
        },
        adminUsers: {
          current: adminCount,
          limit: limits.adminUsers,
          percentage: limits.adminUsers === "unlimited"
            ? 0
            : Math.round((adminCount / (limits.adminUsers as number)) * 100),
        },
      },
    };
  }

  /**
   * Check multiple features at once (for dashboard display)
   */
  static async checkMultipleFeatures(
    tenantId: string,
    features: (keyof PlanLimits)[]
  ): Promise<Record<string, FeatureCheckResult>> {
    const results: Record<string, FeatureCheckResult> = {};

    for (const feature of features) {
      results[feature] = await this.hasFeatureAccess(tenantId, feature);
    }

    return results;
  }
}

/**
 * Helper function to format limit for display
 */
export function formatLimit(limit: number | "unlimited"): string {
  return limit === "unlimited" ? "Unlimited" : limit.toString();
}

/**
 * Helper function to check if limit is reached
 */
export function isLimitReached(current: number, limit: number | "unlimited"): boolean {
  if (limit === "unlimited") return false;
  return current >= limit;
}
