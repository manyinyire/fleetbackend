import { requireSuperAdmin } from '@/lib/auth-helpers';
import { ReportBuilder } from '@/components/admin/report-builder';

export const metadata = {
  title: 'Report Builder | Super Admin',
  description: 'Create custom reports and analytics'
};

export default async function ReportBuilderPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Custom Report Builder</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Build custom reports with flexible columns, filters, and aggregations
        </p>
      </div>

      <ReportBuilder />
    </div>
  );
}
