'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function signUp(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const companyName = formData.get('companyName') as string;
  const phone = formData.get('phone') as string;

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: companyName,
      slug: companyName.toLowerCase().replace(/\s+/g, '-'),
      email,
      phone,
      plan: 'FREE',
      status: 'ACTIVE',
    },
  });

  // Create tenant settings with defaults
  await prisma.tenantSettings.create({
    data: {
      tenantId: tenant.id,
      companyName,
      email,
      phone,
    },
  });

  // Create admin user with BetterAuth
  const user = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
      data: {
        tenantId: tenant.id,
        role: 'TENANT_ADMIN',
      },
    },
  });

  if (user.error) {
    throw new Error(user.error.message || 'Failed to create user');
  }

  revalidatePath('/');
  redirect('/onboarding');
}