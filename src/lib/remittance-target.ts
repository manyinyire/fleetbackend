/**
 * Utility functions for calculating remittance targets based on vehicle payment configuration
 */

interface PaymentConfig {
  amount?: number;
  frequency?: string;
  percentage?: number;
  closingDay?: string;
  baseAmount?: number;
  commissionPercentage?: number;
}

/**
 * Get the start and end dates for a period based on frequency and a reference date
 * @param frequency The frequency (DAILY, WEEKLY, MONTHLY)
 * @param date The reference date
 * @returns Object with startDate and endDate
 */
export function getPeriodBoundaries(frequency: string, date: Date): { startDate: Date; endDate: Date } {
  const referenceDate = new Date(date);
  referenceDate.setHours(0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date;

  switch (frequency.toUpperCase()) {
    case 'DAILY':
      startDate = new Date(referenceDate);
      endDate = new Date(referenceDate);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'WEEKLY':
      // Get Monday of the week (ISO week starts on Monday)
      const dayOfWeek = referenceDate.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust Sunday (0) to previous Monday
      startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() + diff);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'MONTHLY':
      startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      // Default to daily
      startDate = new Date(referenceDate);
      endDate = new Date(referenceDate);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
}

/**
 * Calculate the target amount for a remittance based on vehicle's payment configuration
 * @param paymentModel The payment model (OWNER_PAYS, DRIVER_REMITS, HYBRID)
 * @param paymentConfig The payment configuration JSON object
 * @returns The target amount, or null if not applicable
 */
export function calculateRemittanceTarget(
  paymentModel: string,
  paymentConfig: PaymentConfig | null | undefined
): number | null {
  if (!paymentConfig) {
    return null;
  }

  switch (paymentModel) {
    case 'DRIVER_REMITS':
      // For DRIVER_REMITS, the target is the fixed amount from paymentConfig
      if (typeof paymentConfig.amount === 'number' && paymentConfig.amount > 0) {
        return paymentConfig.amount;
      }
      return null;

    case 'OWNER_PAYS':
      // OWNER_PAYS doesn't have a fixed target for remittances
      return null;

    case 'HYBRID':
      // For HYBRID, the base amount could be considered a target
      if (typeof paymentConfig.baseAmount === 'number' && paymentConfig.baseAmount > 0) {
        return paymentConfig.baseAmount;
      }
      return null;

    default:
      return null;
  }
}

/**
 * Calculate the remaining balance for the current period
 * @param fullTarget The full target amount for the period
 * @param existingRemittancesSum The sum of approved remittances already made in the period
 * @returns The remaining balance (fullTarget - existingRemittancesSum), minimum 0
 */
export function calculateRemainingBalance(
  fullTarget: number | null,
  existingRemittancesSum: number
): number | null {
  if (fullTarget === null || fullTarget === undefined) {
    return null;
  }
  const remaining = fullTarget - existingRemittancesSum;
  return Math.max(0, remaining);
}

/**
 * Check if a remittance amount meets or exceeds the target (or remaining balance)
 * @param amount The remittance amount
 * @param targetAmount The target amount (can be null) - this should be the remaining balance for period-based targets
 * @returns true if target is reached, false otherwise
 */
export function isTargetReached(amount: number, targetAmount: number | null): boolean {
  if (targetAmount === null || targetAmount === undefined) {
    return false;
  }
  return amount >= targetAmount;
}

