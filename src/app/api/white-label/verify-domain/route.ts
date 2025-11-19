/**
 * Custom Domain Verification API
 * Verifies custom domain DNS configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTenant } from '@/lib/auth-helpers';
import { SubscriptionPlan } from '@prisma/client';
import { promises as dns } from 'dns';
import { apiLogger } from '@/lib/logger';

/**
 * POST /api/white-label/verify-domain
 * Verify custom domain DNS configuration
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

    const whiteLabel = await prisma.whiteLabel.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!whiteLabel || !whiteLabel.customDomain) {
      return NextResponse.json(
        {
          success: false,
          error: 'No custom domain configured',
        },
        { status: 400 }
      );
    }

    // In production, you would verify DNS records here
    // For now, we'll simulate verification
    const isVerified = await verifyDNSRecords(whiteLabel.customDomain);

    if (isVerified) {
      await prisma.whiteLabel.update({
        where: { tenantId: tenant.id },
        data: { domainVerified: true },
      });

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Custom domain verified successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Custom domain verification failed. Please check DNS records.',
        instructions: {
          type: 'CNAME',
          host: whiteLabel.customDomain,
          value: process.env.NEXT_PUBLIC_APP_URL || 'app.fleetmanager.com',
          ttl: 3600,
        },
      });
    }
  } catch (error) {
    apiLogger.error({ err: error }, 'Failed to verify custom domain');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify custom domain',
      },
      { status: 500 }
    );
  }
}

/**
 * Verify DNS records for custom domain
 * Checks for CNAME record pointing to the app domain
 */
async function verifyDNSRecords(domain: string): Promise<boolean> {
  try {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'app.fleetmanager.com';

    apiLogger.info({ domain, appDomain }, 'Verifying DNS for custom domain');

    // Try to resolve CNAME records
    try {
      const records = await dns.resolveCname(domain);
      apiLogger.info({ domain, records }, 'CNAME records found');

      // Check if any CNAME record points to our app domain
      const isValid = records.some(record =>
        record.toLowerCase().includes(appDomain.toLowerCase()) ||
        record.toLowerCase().endsWith(appDomain.toLowerCase())
      );

      if (isValid) {
        apiLogger.info({ domain, appDomain }, 'Custom domain DNS verification successful');
        return true;
      }
    } catch (cnameError: any) {
      // CNAME not found, try A record as fallback
      apiLogger.debug({ err: cnameError }, 'No CNAME record found, checking A records');

      try {
        const aRecords = await dns.resolve4(domain);
        const appARecords = await dns.resolve4(appDomain);

        // Check if domain points to same IP as app domain
        const hasMatchingIP = aRecords.some(ip => appARecords.includes(ip));

        if (hasMatchingIP) {
          apiLogger.info({ domain, aRecords }, 'Custom domain A record verification successful');
          return true;
        }
      } catch (aError) {
        apiLogger.debug({ err: aError }, 'No A record match found');
      }
    }

    apiLogger.warn({ domain, appDomain }, 'DNS verification failed - no matching records');
    return false;
  } catch (error) {
    apiLogger.error({ err: error, domain }, 'DNS verification error');
    return false;
  }
}
