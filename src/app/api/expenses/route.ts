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
    const category = searchParams.get('category');
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
    
    if (category) where.category = category;
    if (vehicleId) where.vehicleId = vehicleId;

    console.log('Expenses query where clause:', where);

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: true,
      },
      orderBy: { date: 'desc' },
      take: 1000, // Remove any default limit
    });

    console.log('Expenses found:', expenses.length);
    
    // Convert Decimal objects to numbers
    const serializedExpenses = serializePrismaResults(expenses);
    
    return NextResponse.json(serializedExpenses);
  } catch (error) {
    console.error('Expenses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const { vehicleId, category, amount, date, description, receipt, status } = body;

    // Validate required fields
    if (!category || !amount || !date || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        tenantId,
        vehicleId: vehicleId || null,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        description,
        receipt: receipt || null,
        status: status || 'PENDING',
      },
      include: {
        vehicle: true,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Expense creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
