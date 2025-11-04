import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default async function SettingsPage() {
  await requireTenantForDashboard();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Platform settings are managed by Super Administrators.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600 mr-4 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Settings Management
            </h2>
            <p className="text-gray-700 mb-4">
              All platform settings including Business Settings (Currency, Timezone, Date Format), 
              Invoice Settings, Notification Settings, and Branding are managed exclusively by 
              Super Administrators.
            </p>
            <p className="text-sm text-gray-600">
              If you need to update any settings, please contact your Super Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}