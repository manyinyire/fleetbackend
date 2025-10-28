import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { serializePrismaResults } from '@/lib/serialize-prisma';

export async function GET(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const source = searchParams.get('source');
    const vehicleId = searchParams.get('vehicleId');

    // Build where clause
    const where: any = {
      tenantId: tenantId
    };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    if (source) where.source = source;
    if (vehicleId) where.vehicleId = vehicleId;

    console.log('Incomes query where clause:', where);

    const incomes = await prisma.income.findMany({
      where,
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
      take: 1000, // Remove any default limit
    });

    console.log('Incomes found:', incomes.length);
    
    // Convert Decimal objects to numbers
    const serializedIncomes = serializePrismaResults(incomes);
    
    return NextResponse.json(serializedIncomes);
  } catch (error) {
    console.error('Incomes fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch incomes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, tenantId } = await requireTenant();
    
    // Set RLS context
    if (tenantId) {
      await setTenantContext(tenantId);
    }
    
    // Get scoped Prisma client
    const prisma = tenantId ? getTenantPrisma(tenantId) : require('@/lib/prisma').prisma;

    const body = await request.json();
    const { vehicleId, source, amount, date, description } = body;

    // Validate required fields
    if (!source || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create income
    const income = await prisma.income.create({
      data: {
        tenantId,
        vehicleId: vehicleId || null,
        source,
        amount: parseFloat(amount),
        date: new Date(date),
        description: description || null,
      },
      include: {
        vehicle: true,
      },
    });

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Income creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create income' },
      { status: 500 }
    );
  }
}
