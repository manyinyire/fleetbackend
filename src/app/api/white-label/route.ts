/**
 * White-Label API
 * Endpoints for managing white-labeling settings (PREMIUM feature)
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { apiLogger } from '@/lib/logger';
import { requireAuth, requireTenant } from '@/lib/auth-helpers';
import { apiLogger } from '@/lib/logger';
import { SubscriptionPlan } from '@prisma/client';
import { apiLogger } from '@/lib/logger';
import { rateLimitByPlan } from '@/lib/rate-limit';
import { apiLogger } from '@/lib/logger';

/**
 * GET /api/white-label
 * Get white-label settings for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenant();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 403 }
      );
    }

    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { tenantId },
    });

    if (!whiteLabel) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No white-label settings configured',
      });
    }

    return NextResponse.json({
      success: true,
      data: whiteLabel,
    });
  } catch (error) {
    apiLogger.error({ err, error }, 'Error fetching white-label settings:');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch white-label settings',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/white-label
 * Create white-label settings (PREMIUM only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenant();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 403 }
      );
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if tenant has PREMIUM plan
    if (tenant.plan !== SubscriptionPlan.PREMIUM) {
      return NextResponse.json(
        {
          success: false,
          error: 'White-labeling is only available for PREMIUM plan',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitResult = await rateLimitByPlan(
      request,
      tenant.plan,
      'api'
    );
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    const {
      companyName,
      logo,
      favicon,
      primaryColor,
      secondaryColor,
      accentColor,
      customDomain,
      emailFromName,
      emailFromAddress,
      supportEmail,
      supportPhone,
      termsUrl,
      privacyUrl,
      customCss,
      customFooter,
    } = body;

    // Validate required fields
    if (!companyName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company name is required',
        },
        { status: 400 }
      );
    }

    // Check if white-label already exists
    const existing = await prisma.whiteLabel.findUnique({
      where: { tenantId: tenant.id },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'White-label settings already exist. Use PATCH to update.',
        },
        { status: 400 }
      );
    }

    // Create white-label settings
    const whiteLabel = await prisma.whiteLabel.create({
      data: {
        tenantId: tenant.id,
        companyName,
        logo,
        favicon,
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#1e40af',
        accentColor: accentColor || '#10b981',
        customDomain,
        emailFromName,
        emailFromAddress,
        supportEmail,
        supportPhone,
        termsUrl,
        privacyUrl,
        customCss,
        customFooter,
      },
    });

    return NextResponse.json({
      success: true,
      data: whiteLabel,
      message: 'White-label settings created successfully',
    });
  } catch (error) {
    apiLogger.error({ err, error }, 'Error creating white-label settings:');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create white-label settings',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/white-label
 * Update white-label settings (PREMIUM only)
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenant();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 403 }
      );
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Check if tenant has PREMIUM plan
    if (tenant.plan !== SubscriptionPlan.PREMIUM) {
      return NextResponse.json(
        {
          success: false,
          error: 'White-labeling is only available for PREMIUM plan',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitResult = await rateLimitByPlan(
      request,
      tenant.plan,
      'api'
    );
    if (rateLimitResult.limited) {
      return rateLimitResult.response;
    }

    const body = await request.json();

    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!whiteLabel) {
      return NextResponse.json(
        {
          success: false,
          error: 'White-label settings not found. Use POST to create.',
        },
        { status: 404 }
      );
    }

    // Update white-label settings
    const updated = await prisma.whiteLabel.update({
      where: { tenantId: tenant.id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'White-label settings updated successfully',
    });
  } catch (error) {
    apiLogger.error({ err, error }, 'Error updating white-label settings:');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update white-label settings',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/white-label
 * Delete white-label settings
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenant();
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant context required' },
        { status: 403 }
      );
    }

    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { tenantId },
    });

    if (!whiteLabel) {
      return NextResponse.json(
        {
          success: false,
          error: 'White-label settings not found',
        },
        { status: 404 }
      );
    }

    await prisma.whiteLabel.delete({
      where: { tenantId },
    });

    return NextResponse.json({
      success: true,
      message: 'White-label settings deleted successfully',
    });
  } catch (error) {
    apiLogger.error({ err, error }, 'Error deleting white-label settings:');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete white-label settings',
      },
      { status: 500 }
    );
  }
}
