import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-helpers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Require super admin role
    await requireRole('SUPER_ADMIN');

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const days = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get tenant counts by plan
    const [premiumTenants, basicTenants, freeTenants] = await Promise.all([
      prisma.tenant.count({ where: { plan: 'PREMIUM' } }),
      prisma.tenant.count({ where: { plan: 'BASIC' } }),
      prisma.tenant.count({ where: { plan: 'FREE' } })
    ]);

    // Calculate MRR and ARR
    const mrr = (premiumTenants * 60) + (basicTenants * 15);
    const arr = mrr * 12;

    // Get previous period for comparison
    const previousEndDate = startDate;
    const previousStartDate = new Date();
    previousStartDate.setDate(previousEndDate.getDate() - days);

    const [prevPremiumTenants, prevBasicTenants] = await Promise.all([
      prisma.tenant.count({ 
        where: { 
          plan: 'PREMIUM',
          createdAt: { lte: previousEndDate }
        } 
      }),
      prisma.tenant.count({ 
        where: { 
          plan: 'BASIC',
          createdAt: { lte: previousEndDate }
        } 
      })
    ]);

    const prevMRR = (prevPremiumTenants * 60) + (prevBasicTenants * 15);
    const mrrGrowth = prevMRR > 0 ? ((mrr - prevMRR) / prevMRR) * 100 : 0;

    // Get churn data
    const cancelledTenants = await prisma.tenant.count({
      where: {
        status: 'CANCELED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const churnRate = (premiumTenants + basicTenants) > 0 ? 
      (cancelledTenants / (premiumTenants + basicTenants)) * 100 : 0;

    // Get new subscriptions in period
    const newSubscriptions = await prisma.tenant.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        plan: {
          in: ['BASIC', 'PREMIUM']
        }
      }
    });

    // Calculate ARPU (Average Revenue Per User)
    const totalPayingTenants = premiumTenants + basicTenants;
    const arpu = totalPayingTenants > 0 ? mrr / totalPayingTenants : 0;

    // Get revenue trend data for charts
    const revenueTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayPremiumTenants = await prisma.tenant.count({
        where: {
          plan: 'PREMIUM',
          createdAt: { lte: dayEnd }
        }
      });
      const dayBasicTenants = await prisma.tenant.count({
        where: {
          plan: 'BASIC',
          createdAt: { lte: dayEnd }
        }
      });

      const dailyRevenue = (dayPremiumTenants * 60) + (dayBasicTenants * 15);

      revenueTrend.push({
        date: dayStart.toISOString().slice(0, 10),
        revenue: dailyRevenue,
        premiumTenants: dayPremiumTenants,
        basicTenants: dayBasicTenants
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue: mrr,
          revenueChange: mrrGrowth,
          activeSubscriptions: totalPayingTenants,
          subscriptionsChange: newSubscriptions,
          churnRate: churnRate,
          churnRateChange: 0, // Calculate based on previous period
          arpu: arpu,
          arr: arr
        },
        planDistribution: {
          premium: premiumTenants,
          basic: basicTenants,
          free: freeTenants,
          total: premiumTenants + basicTenants + freeTenants
        },
        revenueTrend,
        metrics: {
          mrr,
          arr,
          arpu,
          churnRate,
          newSubscriptions,
          cancelledTenants
        }
      }
    });

  } catch (error) {
    console.error('Billing overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing overview' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}