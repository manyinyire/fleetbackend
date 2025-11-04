import { prisma } from "@/lib/prisma";
import { getTenantPrisma } from "@/lib/get-tenant-prisma";
import { getTenantId } from "@/lib/tenant";

export async function getTopProducts() {
  // Get top vehicles by remittance revenue (last 30 days)
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      // Return empty array if no tenant context
      return [];
    }

    const tenantPrisma = getTenantPrisma(tenantId);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topVehicles = await tenantPrisma.vehicle.findMany({
      include: {
        remittances: {
          where: {
            date: { gte: thirtyDaysAgo },
            status: 'APPROVED'
          },
          select: {
            amount: true
          }
        }
      },
      take: 10
    });

    // Calculate total revenue per vehicle
    const vehiclesWithRevenue = topVehicles.map((vehicle: any) => {
      const totalRevenue = vehicle.remittances.reduce((sum: number, remittance: any) => 
        sum + Number(remittance.amount), 0
      );
      return {
        image: "/images/vehicle-placeholder.png", // Placeholder image
        name: `${vehicle.make} ${vehicle.model}`,
        category: vehicle.type,
        price: Number(vehicle.initialCost),
        sold: vehicle.remittances.length, // Number of remittances
        profit: totalRevenue,
      };
    }).sort((a, b) => b.profit - a.profit).slice(0, 4);

    return vehiclesWithRevenue;
  } catch (error) {
    console.error('Error fetching top vehicles:', error);
    // Return empty array on error
    return [];
  }
}

export async function getInvoiceTableData() {
  // Get real invoices from database
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      // Return empty array if no tenant context
      return [];
    }

    const tenantPrisma = getTenantPrisma(tenantId);
    
    const invoices = await tenantPrisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    return invoices.map(invoice => ({
      id: invoice.id,
      name: `${invoice.plan} - ${invoice.tenant.name}`,
      price: Number(invoice.amount),
      date: invoice.createdAt.toISOString(),
      status: invoice.status === 'PAID' ? 'Paid' : 
              invoice.status === 'OVERDUE' ? 'Unpaid' : 
              invoice.status === 'PENDING' ? 'Pending' : 'Pending',
    }));
  } catch (error) {
    console.error('Error fetching invoices:', error);
    // Return empty array on error
    return [];
  }
}

export async function getTopChannels() {
  // Get top tenants by revenue (replacing "channels" concept)
  try {
    const topTenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        monthlyRevenue: { gt: 0 }
      },
      orderBy: {
        monthlyRevenue: 'desc'
      },
      take: 5,
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return topTenants.map((tenant, index) => ({
      name: tenant.name,
      visitors: tenant._count.users, // Using user count as "visitors"
      revenues: Number(tenant.monthlyRevenue),
      sales: tenant._count.users, // User count
      conversion: tenant.plan === 'PREMIUM' ? 85 : tenant.plan === 'BASIC' ? 60 : 30, // Estimated conversion based on plan
      logo: `/images/tenant-${index + 1}.png`, // Placeholder
    }));
  } catch (error) {
    console.error('Error fetching top tenants:', error);
    // Return empty array on error
    return [];
  }
}
