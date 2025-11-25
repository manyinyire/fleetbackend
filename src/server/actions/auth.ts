'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import { authLogger } from '@/lib/logger';

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

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create admin user with NextAuth/Prisma
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        tenantId: tenant.id,
        role: 'TENANT_ADMIN',
        emailVerified: false, // User must verify email
      },
    });

    // Mark that we shouldn't cleanup if we reach here
    shouldCleanup = false;

    // Create email verification token and send email
    let emailSent = false;
    try {
      authLogger.info({ email }, 'Creating verification token for user');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          token: verificationToken,
          type: 'EMAIL_VERIFICATION',
          expiresAt,
          used: false,
        },
      });
      authLogger.info({ email }, 'Verification token created');

      // Send verification email
      authLogger.info({ email }, 'Attempting to send verification email');
      const { emailService } = await import('@/lib/email');
      emailSent = await emailService.sendVerificationEmail(email, verificationToken, name);

      if (!emailSent) {
        authLogger.error({ email }, 'Failed to send verification email');
      } else {
        authLogger.info({ email }, 'Verification email sent successfully');
      }
    } catch (emailError) {
      authLogger.error({ email, err: emailError }, 'Exception while sending verification email');
      // Don't fail the signup process if email fails, but log it clearly
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
      authLogger.error({ err: invoiceError }, 'Failed to generate invoice');
      // Don't fail the signup process if invoice generation fails
    }

    revalidatePath('/');
  } catch (error) {
    // Clean up tenant and settings ONLY if we should cleanup (user creation failed)
    if (shouldCleanup && tenant) {
      try {
        if (tenantSettings) {
          await prisma.tenantSettings.delete({
            where: { tenantId: tenant.id },
          }).catch(() => { });
        }
        await prisma.tenant.delete({
          where: { id: tenant.id },
        }).catch(() => { });
      } catch (cleanupError) {
        authLogger.error({ err: cleanupError }, 'Failed to cleanup tenant');
      }
    }

    // Re-throw the error
    throw error;
  }

  // Redirect to email verification page instead of onboarding
  // User must verify email before they can access the dashboard
  redirect('/auth/email-verified?unverified=true&email=' + encodeURIComponent(email));
}