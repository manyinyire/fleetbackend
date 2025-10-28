import { requireSuperAdmin } from '@/lib/auth-helpers';
import { EmailTemplatesManager } from '@/components/admin/email-templates-manager';

export const metadata = {
  title: 'Email Templates | Super Admin',
  description: 'Manage email templates for the system'
};

export default async function EmailTemplatesPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create and manage email templates for various system notifications
        </p>
      </div>

      <EmailTemplatesManager />
    </div>
  );
}
