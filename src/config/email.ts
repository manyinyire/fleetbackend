/**
 * Email Configuration
 */

export const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Fleet Manager',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@fleetmanager.com',
  },

  templates: {
    // Default email addresses for examples/placeholders
    supportEmail: 'support@fleetmanager.com',
    infoEmail: 'info@fleetmanager.com',
  },
} as const;
