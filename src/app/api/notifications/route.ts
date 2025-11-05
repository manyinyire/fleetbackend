import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse } from '@/lib/api-middleware';
import { getPeriodBoundaries, calculateRemittanceTarget, calculateRemainingBalance } from '@/lib/remittance-target';

export const GET = withTenantAuth(async ({ prisma, tenantId, request }) => {
  const notifications: Array<{
    id: string;
    type: 'remittance_due' | 'license_expiring';
    title: string;
    message: string;
    link: string;
    severity: 'warning' | 'critical';
    date: Date;
  }> = [];

  // 1. Check for due remittances
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all active driver-vehicle assignments
  const activeAssignments = await prisma.driverVehicleAssignment.findMany({
    where: {
      tenantId,
      endDate: null, // Active assignments only
    },
    include: {
      driver: {
        select: {
          id: true,
          fullName: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          paymentModel: true,
          paymentConfig: true,
        },
      },
    },
  });

  // Check each assignment for due remittances
  for (const assignment of activeAssignments) {
    const vehicle = assignment.vehicle;
    const driver = assignment.driver;

    // Only check for DRIVER_REMITS and HYBRID models
    if (vehicle.paymentModel === 'DRIVER_REMITS' || vehicle.paymentModel === 'HYBRID') {
      const paymentConfig = vehicle.paymentConfig as any;
      const frequency = paymentConfig?.frequency || 'DAILY';

      // Skip if frequency is not period-based
      if (frequency === 'DAILY' || frequency === 'WEEKLY' || frequency === 'MONTHLY') {
        // Get period boundaries for today
        const { startDate, endDate } = getPeriodBoundaries(frequency, today);

        // Calculate target amount
        const fullTarget = calculateRemittanceTarget(vehicle.paymentModel, paymentConfig);

        if (fullTarget !== null && fullTarget > 0) {
          // Sum approved remittances for this period
          const approvedRemittances = await prisma.remittance.findMany({
            where: {
              driverId: driver.id,
              vehicleId: vehicle.id,
              status: 'APPROVED',
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: {
              amount: true,
            },
          });

          const existingSum = approvedRemittances.reduce(
            (sum: number, r: any) => sum + Number(r.amount),
            0
          );

          const remainingBalance = calculateRemainingBalance(fullTarget, existingSum);

          // If there's a remaining balance, create a notification
          if (remainingBalance !== null && remainingBalance > 0) {
            // Check if we're past the period end date (overdue) or within the period (due)
            const isOverdue = today > endDate;

            notifications.push({
              id: `remittance-${driver.id}-${vehicle.id}-${today.toISOString()}`,
              type: 'remittance_due',
              title: isOverdue
                ? `Overdue Remittance: ${driver.fullName}`
                : `Remittance Due: ${driver.fullName}`,
              message: `${driver.fullName} has ${remainingBalance.toLocaleString()} remaining for ${vehicle.registrationNumber} (${frequency.toLowerCase()} period)`,
              link: `/remittances/new?driverId=${driver.id}&vehicleId=${vehicle.id}`,
              severity: isOverdue ? 'critical' : 'warning',
              date: isOverdue ? endDate : today,
            });
          }
        }
      }
    }
  }

  // 2. Check for expiring licenses (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  thirtyDaysFromNow.setHours(23, 59, 59, 999);

  const driversWithExpiringLicenses = await prisma.driver.findMany({
    where: {
      tenantId,
      hasDefensiveLicense: true,
      defensiveLicenseExpiry: {
        not: null,
        lte: thirtyDaysFromNow,
        gte: today, // Not already expired
      },
      status: 'ACTIVE',
    },
    select: {
      id: true,
      fullName: true,
      defensiveLicenseExpiry: true,
      defensiveLicenseNumber: true,
    },
  });

  for (const driver of driversWithExpiringLicenses) {
    if (driver.defensiveLicenseExpiry) {
      const expiryDate = new Date(driver.defensiveLicenseExpiry);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const isExpired = expiryDate < today;
      const isExpiringSoon = daysUntilExpiry <= 7;

      notifications.push({
        id: `license-${driver.id}-${expiryDate.toISOString()}`,
        type: 'license_expiring',
        title: isExpired
          ? `License Expired: ${driver.fullName}`
          : isExpiringSoon
          ? `License Expiring Soon: ${driver.fullName}`
          : `License Expiring: ${driver.fullName}`,
        message: `Defensive license ${driver.defensiveLicenseNumber || ''} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
        link: `/drivers/${driver.id}`,
        severity: isExpired || isExpiringSoon ? 'critical' : 'warning',
        date: expiryDate,
      });
    }
  }

  // Sort notifications by severity (critical first) and date (most urgent first)
  notifications.sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return a.date.getTime() - b.date.getTime();
  });

  return successResponse({
    success: true,
    notifications,
    count: notifications.length,
    unreadCount: notifications.length, // All notifications are considered unread for now
  });
});
