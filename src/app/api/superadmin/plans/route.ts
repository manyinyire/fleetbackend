import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscriptionService } from "@/services/subscription.service";

/**
 * GET /api/superadmin/plans
 * Get all plan configurations
 */
export async function GET(request: NextRequest) {
  try {
    const plans = await subscriptionService.getAllPlans();

    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    apiLogger.error({ err: error }, '`'');
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/plans
 * Create or update plan configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      plan,
      displayName,
      description,
      monthlyPrice,
      yearlyPrice,
      features,
      limits,
      isActive
    } = body;

    // Validate required fields
    if (!plan || !displayName || monthlyPrice === undefined || yearlyPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upsert plan configuration
    const planConfig = await prisma.planConfiguration.upsert({
      where: { plan },
      update: {
        displayName,
        description,
        monthlyPrice,
        yearlyPrice,
        features,
        limits,
        isActive: isActive !== undefined ? isActive : true
      },
      create: {
        plan,
        displayName,
        description,
        monthlyPrice,
        yearlyPrice,
        features,
        limits,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: plan === 'FREE' ? 0 : plan === 'BASIC' ? 1 : 2
      }
    });

    return NextResponse.json({
      success: true,
      plan: planConfig
    });
  } catch (error) {
    apiLogger.error({ err: error }, '`'');
    return NextResponse.json(
      { error: "Failed to save plan configuration" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/superadmin/plans
 * Seed default plan configurations
 */
export async function PUT(request: NextRequest) {
  try {
    await subscriptionService.seedPlanConfigurations();

    return NextResponse.json({
      success: true,
      message: "Plan configurations seeded successfully"
    });
  } catch (error) {
    apiLogger.error({ err: error }, '`'');
    return NextResponse.json(
      { error: "Failed to seed plan configurations" },
      { status: 500 }
    );
  }
}
