import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',

  // Disable telemetry to avoid Edge Runtime issues
  telemetry: {
    enabled: false,
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },

  user: {
    additionalFields: {
      tenantId: {
        type: 'string',
        required: false,
        defaultValue: null,
        input: true,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: true,
      },
    },
  },

  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
  },

  // CSRF protection
  csrf: {
    enabled: true,
  },

  // Hooks to check tenant status - temporarily disabled due to API changes
  // hooks: {
  //   after: async (ctx) => {
  //     if (ctx.path === '/sign-in/email') {
  //       const session = ctx.context.session;
  //       if (session?.user?.tenantId) {
  //         // Check if tenant is suspended
  //         const tenant = await prisma.tenant.findUnique({
  //           where: { id: (session.user as any).tenantId },
  //           select: { status: true }
  //         });

  //         if (tenant?.status === 'SUSPENDED') {
  //           throw new Error('Your account has been suspended. Please contact support.');
  //         }

  //         if (tenant?.status === 'CANCELED') {
  //           throw new Error('Your account has been cancelled. Please contact support to reactivate.');
  //         }
  //       }
  //     }
  //   }
  // }
});

export type Auth = typeof auth;