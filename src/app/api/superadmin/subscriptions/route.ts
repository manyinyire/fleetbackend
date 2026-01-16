import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { apiLogger } from "@/lib/logger";

const DEFAULT_LIMIT = 25;

export async function GET(request: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");

    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const plan = url.searchParams.get("plan") || "";
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(url.searchParams.get("limit") || `${DEFAULT_LIMIT}`, 10), 1),
      100,
    );

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      whereClause.status = status as any;
    }

    if (plan) {
      whereClause.plan = plan as any;
    }

    // Run queries in parallel without transaction to avoid timeout issues
    const now = new Date();
    const fourteenDays = new Date(now);
    fourteenDays.setDate(now.getDate() + 14);

    const [tenants, totalCount, activeCount, trialCount, cancelledCount, expiringCount] = await Promise.all([
      prisma.tenant.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          status: true,
          isInTrial: true,
          trialEndDate: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          autoRenew: true,
          monthlyRevenue: true,
          updatedAt: true,
        },
      }),
      prisma.tenant.count({ where: whereClause }),
      prisma.tenant.count({
        where: {
          status: "ACTIVE",
          plan: { not: "FREE" },
        },
      }),
      prisma.tenant.count({
        where: {
          isInTrial: true,
        },
      }),
      prisma.tenant.count({
        where: { status: "CANCELED" },
      }),
      prisma.tenant.count({
        where: {
          status: "ACTIVE",
          plan: { not: "FREE" },
          subscriptionEndDate: {
            gte: now,
            lte: fourteenDays,
          },
        },
      }),
    ]);

    const summaryCounts = {
      activeCount,
      trialCount,
      cancelledCount,
      expiringCount,
    };

    const subscriptionItems = tenants.map((tenant) => {
      // Calculate next billing date (monthly billing cycle)
      let nextBilling = null;

      if (tenant.subscriptionStartDate) {
        const startDate = new Date(tenant.subscriptionStartDate);
        const now = new Date();
        
        // Calculate next billing as the next month anniversary from start date
        const nextBillingDate = new Date(startDate);
        
        // Keep adding months until we get a future date
        while (nextBillingDate <= now) {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
        
        nextBilling = nextBillingDate.toISOString();
      }

      return {
        id: tenant.id,
        tenantName: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
        status: tenant.status,
        isInTrial: tenant.isInTrial,
        trialEndsAt: tenant.trialEndDate ? tenant.trialEndDate.toISOString() : null,
        subscriptionStart: tenant.subscriptionStartDate
          ? tenant.subscriptionStartDate.toISOString()
          : null,
        nextBilling,
        autoRenew: tenant.autoRenew,
        monthlyRevenue: Number(tenant.monthlyRevenue || 0),
        updatedAt: tenant.updatedAt.toISOString(),
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          active: summaryCounts.activeCount,
          trial: summaryCounts.trialCount,
          expiringSoon: summaryCounts.expiringCount,
          cancelled: summaryCounts.cancelledCount,
        },
        subscriptions: subscriptionItems,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Failed to load subscriptions');
    return NextResponse.json(
      { error: "Failed to load subscriptions" },
      { status: 500 },
    );
  }
}

