import { requireRole } from '@/lib/auth-helpers';

export default async function ThemesPage() {
  await requireRole('SUPER_ADMIN');
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Theme Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Customize platform appearance and branding</p>
      </div>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          🚧 This page is under construction. Theme customization features will be available soon.
        </p>
      </div>
    </div>
  );
}
