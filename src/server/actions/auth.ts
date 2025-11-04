'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function signUp(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string;
  const phone = formData.get('phone') as string;

  // Validate inputs
  if (!name || !email || !password || !companyName) {
    throw new Error('All fields are required');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  let tenant;
  let tenantSettings;
  let shouldCleanup = true;

  try {
    // Generate unique slug
    const slug = await generateUniqueSlug(companyName);

    // Create tenant
    tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        slug,
        email,
        phone,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    });

    // Create tenant settings with defaults
    tenantSettings = await prisma.tenantSettings.create({
      data: {
        tenantId: tenant.id,
        companyName,
        email,
        phone,
      },
    });

    // Create admin user with BetterAuth
    const userResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        tenantId: tenant.id,
        role: 'TENANT_ADMIN',
      },
    });

    // User created successfully
    // Note: BetterAuth with requireEmailVerification: true should NOT create a session
    // The user will need to verify their email before they can log in

    // Mark that we shouldn't cleanup if we reach here
    shouldCleanup = false;

    // Ensure the user has the tenant ID and role set (if needed)
    if (userResult.user?.id) {
      await prisma.user.update({
        where: { id: userResult.user.id },
        data: {
          tenantId: tenant.id,
          role: 'TENANT_ADMIN',
          emailVerified: false, // Explicitly set to false
        },
      });

      // Send email verification OTP using BetterAuth's emailOTP plugin
      try {
        // Use BetterAuth's emailOTP to send verification OTP
        await auth.api.sendVerificationOTP({
          body: {
            email,
            type: 'email-verification',
          },
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail the signup process if email fails
      }

      // Generate and send free plan invoice
      try {
        const { invoiceGenerator } = await import('@/lib/invoice-generator');
        const { emailService } = await import('@/lib/email');
        
        const { invoice, pdf } = await invoiceGenerator.createFreePlanInvoice(tenant.id);
        
        const invoiceData = {
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(invoice.amount),
          dueDate: invoice.dueDate.toLocaleDateString(),
          companyName: tenant.name,
          userName: name
        };

        await emailService.sendInvoiceEmail(email, invoiceData, pdf);
      } catch (invoiceError) {
        console.error('Failed to generate invoice:', invoiceError);
        // Don't fail the signup process if invoice generation fails
      }
    }

    revalidatePath('/');
  } catch (error) {
    // Clean up tenant and settings ONLY if we should cleanup (user creation failed)
    if (shouldCleanup && tenant) {
      try {
        if (tenantSettings) {
          await prisma.tenantSettings.delete({
            where: { tenantId: tenant.id },
          }).catch(() => {});
        }
        await prisma.tenant.delete({
          where: { id: tenant.id },
        }).catch(() => {});
      } catch (cleanupError) {
        console.error('Failed to cleanup tenant:', cleanupError);
      }
    }

    // Re-throw the error
    throw error;
  }

  // Redirect to email verification page instead of onboarding
  // User must verify email before they can access the dashboard
  redirect('/auth/email-verified?unverified=true&email=' + encodeURIComponent(email));
}