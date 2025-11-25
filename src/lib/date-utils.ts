/**
 * Date utility functions for consistent date formatting across the application
 * Ensures server/client hydration consistency
 */

/**
 * Format a date string consistently for display
 * Uses en-US locale to prevent hydration errors between server and client
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Error formatting date:');
    return '-';
  }
}

/**
 * Format a date string with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Error formatting date time:');
    return '-';
  }
}

/**
 * Format a date string with long month name
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '-';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    apiLogger.error({ err: error }, 'Error formatting date long:');
    return '-';
  }
}

/**
 * Format a date for ISO string (used in datetime attributes)
 */
export function formatDateISO(date: string | Date | null | undefined): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateObj.toISOString();
  } catch (error) {
    apiLogger.error({ err: error }, 'Error formatting date ISO:');
    return '';
  }
}
