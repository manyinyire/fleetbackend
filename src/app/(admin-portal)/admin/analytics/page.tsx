import { requireSuperAdmin } from '@/lib/auth-helpers';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';

export const metadata = {
  title: 'Analytics | Super Admin',
  description: 'Platform analytics and insights'
};

export default async function AnalyticsPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Analytics</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Comprehensive insights into platform usage and performance
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
