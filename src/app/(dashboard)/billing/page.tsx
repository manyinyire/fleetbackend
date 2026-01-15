import { requireAuth } from '@/lib/auth-helpers';
import { InvoiceManager } from '@/components/invoices/InvoiceManager';

export const metadata = {
  title: 'Billing & Invoices | Fleet Manager',
  description: 'Manage your billing and invoices'
};

export default async function BillingPage() {
  await requireAuth();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Invoices</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your invoices and billing information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoice Management */}
        <div className="lg:col-span-2">
          <InvoiceManager />
        </div>

        {/* Billing Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Plan</label>
              <p className="mt-1 text-sm text-gray-900">Free Plan</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Next Billing Date</label>
              <p className="mt-1 text-sm text-gray-900">Monthly</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <p className="mt-1 text-sm text-gray-900">Not configured</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}