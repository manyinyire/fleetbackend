import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware';
import { emailService } from '@/lib/email';
import { z } from 'zod';

const testEmailSchema = z.object({
    to: z.string().email(),
    type: z.enum(['welcome', 'invoice', 'reminder', 'verification', 'otp']).optional().default('welcome'),
});

/**
 * POST /api/test/email
 * Send a test email to verify SMTP configuration (Admin only)
 */
export const POST = withAuth(async ({ user, request }) => {
    try {
        // Check if user is admin
        if (!user.role.includes('ADMIN') && !user.role.includes('SUPER_ADMIN')) {
            return errorResponse('Only admins can send test emails', 403);
        }

        const body = await request.json();
        const { to, type } = testEmailSchema.parse(body);

        let result = false;
        let message = '';

        switch (type) {
            case 'welcome':
                result = await emailService.sendWelcomeEmail(to, user.name || 'Test User', 'FREE');
                message = 'Welcome email sent';
                break;

            case 'verification':
                result = await emailService.sendVerificationEmail(to, 'test-token-123', user.name || 'Test User');
                message = 'Verification email sent';
                break;

            case 'otp':
                result = await emailService.sendOTPEmail(to, '123456', user.name || 'Test User');
                message = 'OTP email sent';
                break;

            case 'invoice':
                // For invoice, we'll send a simple test email
                result = await emailService.sendEmail({
                    to,
                    subject: 'Test Invoice Email - Fleet Manager',
                    html: '<h1>Test Invoice Email</h1><p>This is a test email to verify SMTP configuration.</p>',
                });
                message = 'Test invoice email sent';
                break;

            case 'reminder':
                // For reminder, we'll send a simple test email
                result = await emailService.sendEmail({
                    to,
                    subject: 'Test Reminder Email - Fleet Manager',
                    html: '<h1>Test Reminder Email</h1><p>This is a test reminder email to verify SMTP configuration.</p>',
                });
                message = 'Test reminder email sent';
                break;
        }

        if (!result) {
            return errorResponse('Failed to send test email. Check SMTP configuration.', 500);
        }

        return successResponse({
            message,
            to,
            type,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return errorResponse('Invalid request data', 400, error.errors);
        }
        console.error('Error sending test email:', error);
        return errorResponse('Failed to send test email', 500);
    }
});
