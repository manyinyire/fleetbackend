/**
 * Email Template Service
 * 
 * Fetches email templates from database and renders them with variables
 */

import { prisma } from './prisma';
import { EmailType } from '@prisma/client';
import logger from './logger';

interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export class EmailTemplateService {
  /**
   * Get template by type
   */
  static async getTemplate(type: EmailType, name?: string) {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          type,
          ...(name && { name }),
          isActive: true
        }
      });

      if (!template) {
        logger.warn({ type, name }, 'Email template not found');
        return null;
      }

      return template;
    } catch (error) {
      logger.error({ err: error, type, name }, 'Error fetching email template');
      return null;
    }
  }

  /**
   * Render template with variables
   */
  static renderTemplate(templateBody: string, variables: TemplateVariables): string {
    let rendered = templateBody;

    // Replace all {{variable}} placeholders with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    return rendered;
  }

  /**
   * Get rendered email by type
   */
  static async getRenderedEmail(
    type: EmailType,
    variables: TemplateVariables,
    templateName?: string
  ): Promise<{ subject: string; html: string } | null> {
    const template = await this.getTemplate(type, templateName);

    if (!template) {
      return null;
    }

    const subject = this.renderTemplate(template.subject, variables);
    const html = this.renderTemplate(template.body, variables);

    return { subject, html };
  }

  /**
   * List all templates
   */
  static async listTemplates(filters?: {
    type?: EmailType;
    isActive?: boolean;
  }) {
    try {
      return await prisma.emailTemplate.findMany({
        where: filters,
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      logger.error({ err: error }, 'Error listing email templates');
      return [];
    }
  }

  /**
   * Create or update template
   */
  static async upsertTemplate(data: {
    name: string;
    type: EmailType;
    subject: string;
    body: string;
    variables?: any;
    isActive?: boolean;
  }) {
    try {
      return await prisma.emailTemplate.upsert({
        where: { name: data.name },
        create: data,
        update: {
          type: data.type,
          subject: data.subject,
          body: data.body,
          variables: data.variables,
          isActive: data.isActive
        }
      });
    } catch (error) {
      logger.error({ err: error, name: data.name }, 'Error upserting email template');
      throw error;
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(id: string) {
    try {
      return await prisma.emailTemplate.delete({
        where: { id }
      });
    } catch (error) {
      logger.error({ err: error, id }, 'Error deleting email template');
      throw error;
    }
  }

  /**
   * Toggle template active status
   */
  static async toggleTemplateStatus(id: string, isActive: boolean) {
    try {
      return await prisma.emailTemplate.update({
        where: { id },
        data: { isActive }
      });
    } catch (error) {
      logger.error({ err: error, id }, 'Error toggling template status');
      throw error;
    }
  }
}

export const emailTemplateService = EmailTemplateService;
