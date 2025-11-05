import { NextRequest } from 'next/server';
import { withTenantAuth, successResponse, validateBody } from '@/lib/api-middleware';
import { z } from 'zod';

// Validation schema for onboarding completion
const completeOnboardingSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(1, 'Phone is required').optional(),
  currency: z.string().default('USD').optional(),
  timezone: z.string().default('Africa/Harare').optional(),
  country: z.string().default('Zimbabwe').optional(),
});

export const POST = withTenantAuth(async ({ prisma, tenantId, user, request }) => {
  const data = await validateBody(request, completeOnboardingSchema);

  // Update tenant settings to mark onboarding as complete
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      companyName: data.companyName || 'Fleet Company',
      email: data.email || user.email,
      phone: data.phone || '+263 77 123 4567',
      currency: data.currency || 'USD',
      timezone: data.timezone || 'Africa/Harare',
      country: data.country || 'Zimbabwe',
      primaryColor: '#1e3a8a',
      invoicePrefix: 'INV',
      dateFormat: 'YYYY-MM-DD',
    },
    update: {
      companyName: data.companyName,
      email: data.email,
      phone: data.phone,
      currency: data.currency,
      timezone: data.timezone,
      country: data.country,
    },
  });

  return successResponse({
    success: true,
    settings,
  });
});
