import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { PremiumFeatureService } from '@/lib/premium-features';

// Validation schema for creating a driver
const createDriverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nationalId: z.string().min(1, 'National ID is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().nullable(),
  homeAddress: z.string().optional().default(''),
  nextOfKin: z.string().optional().default(''),
  nextOfKinPhone: z.string().optional().default(''),
  hasDefensiveLicense: z.boolean().optional().default(false),
  defensiveLicenseNumber: z.string().optional(),
  defensiveLicenseExpiry: z.string().optional(),
});

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const { page, limit } = getPaginationFromRequest(request);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  // Build where clause
  const where: any = {
    tenantId: tenantId,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { nationalId: { contains: search, mode: 'insensitive' } },
      { licenseNumber: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      include: {
        vehicles: {
          where: {
            endDate: null, // Active assignments only
          },
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
        },
        _count: {
          select: {
            remittances: true,
            contracts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.driver.count({ where }),
  ]);

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    const data = await request.json();

    // Check if tenant can add more drivers (premium feature check)
    const featureCheck = await PremiumFeatureService.canAddDriver(tenantId);

    if (!featureCheck.allowed) {
      return NextResponse.json(
        {
          error: featureCheck.reason,
          currentUsage: featureCheck.currentUsage,
          limit: featureCheck.limit,
          suggestedPlan: featureCheck.suggestedPlan,
          upgradeMessage: featureCheck.upgradeMessage,
        },
        { status: 403 }
      );
    }

    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }

export const POST = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const data = await validateBody(request, createDriverSchema);

  // Check for duplicate national ID
  const existing = await prisma.driver.findFirst({
    where: {
      tenantId: tenantId,
      nationalId: data.nationalId,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: `A driver with national ID "${data.nationalId}" already exists` },
      { status: 409 }
    );
  }

  const driver = await prisma.driver.create({
    data: {
      tenantId,
      fullName: data.fullName,
      nationalId: data.nationalId,
      licenseNumber: data.licenseNumber,
      phone: data.phone,
      email: data.email || null,
      homeAddress: data.homeAddress,
      nextOfKin: data.nextOfKin,
      nextOfKinPhone: data.nextOfKinPhone,
      hasDefensiveLicense: data.hasDefensiveLicense,
      defensiveLicenseNumber: data.defensiveLicenseNumber || null,
      defensiveLicenseExpiry: data.defensiveLicenseExpiry ? new Date(data.defensiveLicenseExpiry) : null,
      debtBalance: 0,
      status: 'ACTIVE',
    },
    include: {
      vehicles: {
        include: {
          vehicle: true,
        },
      },
    },
  });

  return successResponse(driver, 201);
});
