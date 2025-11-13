import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/email-templates - Get all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;

    if (!session?.user || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Transform to match component interface
    const transformedTemplates = templates.map(template => {
      const variables = (template.variables as any) || [];
      const variablesArray = Array.isArray(variables) ? variables : [];
      
      // Map EmailType to category
      let category: 'welcome' | 'notification' | 'reminder' | 'alert' | 'custom' = 'custom';
      if (template.type === 'WELCOME') category = 'welcome';
      else if (template.type === 'INVOICE_NOTIFICATION' || template.type === 'SUBSCRIPTION_RENEWAL') category = 'notification';
      else if (template.type === 'TRIAL_EXPIRING' || template.type === 'PAYMENT_FAILED') category = 'reminder';
      else if (template.type === 'ACCOUNT_SUSPENDED' || template.type === 'ADMIN_NOTIFICATION') category = 'alert';

      return {
        id: template.id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: variablesArray,
        category,
        isActive: template.isActive,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString()
      };
    });

    return NextResponse.json({ templates: transformedTemplates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;

    if (!session?.user || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await request.json();
    const { name, subject, body, variables, category, isActive } = requestBody;

    // Map category to EmailType
    let emailType: 'WELCOME' | 'PASSWORD_RESET' | 'INVOICE_NOTIFICATION' | 'SUBSCRIPTION_RENEWAL' | 'PAYMENT_FAILED' | 'TRIAL_EXPIRING' | 'ACCOUNT_SUSPENDED' | 'ADMIN_NOTIFICATION' = 'ADMIN_NOTIFICATION';
    if (category === 'welcome') emailType = 'WELCOME';
    else if (category === 'notification') emailType = 'INVOICE_NOTIFICATION';
    else if (category === 'reminder') emailType = 'TRIAL_EXPIRING';
    else if (category === 'alert') emailType = 'ACCOUNT_SUSPENDED';

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        type: emailType,
        subject,
        body,
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Error creating email template:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}

