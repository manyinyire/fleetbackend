import { getPlatformSettingsWithDefaults } from '@/lib/platform-settings';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export default async function MaintenancePage() {
  const settings = await getPlatformSettingsWithDefaults();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
            <WrenchScrewdriverIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Under Maintenance
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          {settings.platformName} is currently undergoing scheduled maintenance.
        </p>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            We&apos;re working hard to improve your experience. Please check back soon.
          </p>
          
          {settings.platformEmail && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              For urgent matters, contact us at{' '}
              <a 
                href={`mailto:${settings.platformEmail}`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {settings.platformEmail}
              </a>
            </p>
          )}
          
          {settings.platformAddress && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {settings.platformAddress}
            </p>
          )}
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>We apologize for any inconvenience.</p>
          <p className="mt-2">Thank you for your patience.</p>
        </div>
      </div>
    </div>
  );
}

