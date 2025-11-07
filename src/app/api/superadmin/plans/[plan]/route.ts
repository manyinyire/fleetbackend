import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@prisma/client";

/**
 * GET /api/superadmin/plans/[plan]
 * Get specific plan configuration
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ plan: string }> }
) {
  try {
    const params = await context.params;
    const { plan } = params;

    const planConfig = await prisma.planConfiguration.findUnique({
      where: { plan: plan as SubscriptionPlan }
    });

    if (!planConfig) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: planConfig
    });
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/plans/[plan]
 * Update specific plan configuration
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ plan: string }> }
) {
  try {
    const params = await context.params;
    const { plan } = params;
    const body = await request.json();

    const planConfig = await prisma.planConfiguration.update({
      where: { plan: plan as SubscriptionPlan },
      data: body
    });

    return NextResponse.json({
      success: true,
      plan: planConfig
    });
  } catch (error) {
    console.error("Failed to update plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/plans/[plan]
 * Deactivate a plan (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ plan: string }> }
) {
  const params = await context.params;
  try {
    const { plan } = params;

    // Don't actually delete, just deactivate
    const planConfig = await prisma.planConfiguration.update({
      where: { plan: plan as SubscriptionPlan },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: "Plan deactivated successfully",
      plan: planConfig
    });
  } catch (error) {
    console.error("Failed to deactivate plan:", error);
    return NextResponse.json(
      { error: "Failed to deactivate plan" },
      { status: 500 }
    );
  }
}
