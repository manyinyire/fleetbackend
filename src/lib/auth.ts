import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP, admin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from './prisma';
import { emailService } from './email';

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
    requireEmailVerification: true, // Enable email verification
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Get user name for email personalization
        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true }
        });

        const userName = user?.name || 'User';

        if (type === 'sign-in') {
          // Send OTP for sign in
          await emailService.sendOTPEmail(email, otp, userName);
        } else if (type === 'email-verification') {
          // Send OTP for email verification
          await emailService.sendOTPEmail(email, otp, userName);
        } else if (type === 'forget-password') {
          // Send OTP for password reset
          await emailService.sendOTPEmail(email, otp, userName);
        }
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      allowedAttempts: 3,
      overrideDefaultEmailVerification: true, // Use OTP instead of verification links
    }),
    admin({
      defaultRole: 'USER',
      adminRoles: ['SUPER_ADMIN', 'admin'], // SUPER_ADMIN is our custom role, admin is BetterAuth default
      impersonationSessionDuration: 60 * 60, // 1 hour
      bannedUserMessage: 'You have been banned from this application. Please contact support if you believe this is an error.',
    }),
    nextCookies(), // Must be last plugin - automatically sets cookies in server actions
  ],

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
      enabled: false, // Disable account linking - removing Google OAuth
    },
  },

  user: {
    // Ensure name, email, image are included in session (default, but explicit)
    publicFields: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      role: true,
      tenantId: true,
    },
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
    // Enable change email (disabled by default)
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url, token }, request) => {
        // Send verification email to current email to approve the change
        await emailService.sendEmail({
          to: user.email,
          subject: 'Approve Email Change - Fleet Manager',
          html: `
            <h2>Email Change Request</h2>
            <p>Hello ${user.name},</p>
            <p>You have requested to change your email address to: <strong>${newEmail}</strong></p>
            <p>Click the link below to approve this change:</p>
            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Approve Email Change</a>
            <p>If you did not request this change, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
          `,
        });
      },
    },
    // Enable user deletion (disabled by default)
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url, token }, request) => {
        // Send verification email for account deletion
        await emailService.sendEmail({
          to: user.email,
          subject: 'Confirm Account Deletion - Fleet Manager',
          html: `
            <h2>Account Deletion Request</h2>
            <p>Hello ${user.name},</p>
            <p>You have requested to delete your account. This action cannot be undone.</p>
            <p>Click the link below to confirm account deletion:</p>
            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px;">Delete My Account</a>
            <p>If you did not request this, please ignore this email and your account will remain active.</p>
            <p>This link will expire in 24 hours.</p>
          `,
        });
      },
      beforeDelete: async (user, request) => {
        // Prevent deletion of SUPER_ADMIN accounts
        if (user.role === 'SUPER_ADMIN') {
          throw new APIError('BAD_REQUEST', {
            message: 'Super admin accounts cannot be deleted',
          });
        }
        
        // Log deletion attempt
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_DELETION_REQUESTED',
            entityType: 'User',
            entityId: user.id,
            newValues: {
              email: user.email,
              requestedAt: new Date().toISOString(),
            },
            ipAddress: request?.ip || request?.headers?.get('x-forwarded-for') || 'unknown',
            userAgent: request?.headers?.get('user-agent') || 'unknown',
          },
        });
      },
      afterDelete: async (user, request) => {
        // Log successful deletion
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_DELETED',
            entityType: 'User',
            entityId: user.id,
            newValues: {
              email: user.email,
              deletedAt: new Date().toISOString(),
            },
            ipAddress: request?.ip || request?.headers?.get('x-forwarded-for') || 'unknown',
            userAgent: request?.headers?.get('user-agent') || 'unknown',
          },
        });
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