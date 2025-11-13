import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search query must be at least 2 characters',
      }, { status: 400 });
    }

    const results: any = {
      users: [],
      tenants: [],
      vehicles: [],
      drivers: [],
      invoices: [],
      auditLogs: [],
    };

    // Search users
    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
      });
    }

    // Search tenants
    if (type === 'all' || type === 'tenants') {
      results.tenants = await prisma.tenant.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              vehicles: true,
            },
          },
        },
        take: limit,
      });
    }

    // Search vehicles
    if (type === 'all' || type === 'vehicles') {
      results.vehicles = await prisma.vehicle.findMany({
        where: {
          OR: [
            { registrationNumber: { contains: query, mode: 'insensitive' } },
            { make: { contains: query, mode: 'insensitive' } },
            { model: { contains: query, mode: 'insensitive' } },
            { vin: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          registrationNumber: true,
          make: true,
          model: true,
          year: true,
          status: true,
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
      });
    }

    // Search drivers
    if (type === 'all' || type === 'drivers') {
      results.drivers = await prisma.driver.findMany({
        where: {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { licenseNumber: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          licenseNumber: true,
          status: true,
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
      });
    }

    // Search invoices
    if (type === 'all' || type === 'invoices') {
      results.invoices = await prisma.invoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: query, mode: 'insensitive' } },
            { tenant: { name: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          dueDate: true,
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
      });
    }

    // Search audit logs
    if (type === 'all' || type === 'auditLogs') {
      results.auditLogs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { action: { contains: query, mode: 'insensitive' } },
            { entityType: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });
    }

    // Calculate total results
    const totalResults =
      results.users.length +
      results.tenants.length +
      results.vehicles.length +
      results.drivers.length +
      results.invoices.length +
      results.auditLogs.length;

    return NextResponse.json({
      success: true,
      data: {
        query,
        type,
        totalResults,
        results,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
