export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export function event({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) {
  if (!GA_MEASUREMENT_ID) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Payment tracking events
export function trackPaymentInitiated(invoiceNumber: string, amount: number, currency: string) {
  event({
    action: 'payment_initiated',
    category: 'Payment',
    label: invoiceNumber,
    value: amount,
  });
}

export function trackPaymentCompleted(invoiceNumber: string, amount: number, currency: string) {
  event({
    action: 'purchase',
    category: 'Payment',
    label: invoiceNumber,
    value: amount,
  });
}

export function trackPaymentFailed(invoiceNumber: string, reason: string) {
  event({
    action: 'payment_failed',
    category: 'Payment',
    label: `${invoiceNumber} - ${reason}`,
  });
}

// Subscription tracking events
export function trackSubscriptionUpgrade(tenantId: string, fromPlan: string, toPlan: string) {
  event({
    action: 'subscription_upgrade',
    category: 'Subscription',
    label: `${fromPlan} to ${toPlan}`,
  });
}

export function trackAccountUnsuspended(tenantId: string) {
  event({
    action: 'account_unsuspended',
    category: 'Account',
    label: tenantId,
  });
}

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}