import { requireRole } from '@/lib/auth-helpers';

export default async function SupportPage() {
  await requireRole('SUPER_ADMIN');
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Get help and contact support</p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-4">📧 Contact Support</h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <p><strong>Email:</strong> support@azaire.com</p>
          <p><strong>Response Time:</strong> Within 24 hours</p>
          <p><strong>Available:</strong> Monday - Friday, 9 AM - 5 PM CAT</p>
        </div>
      </div>
    </div>
  );
}
