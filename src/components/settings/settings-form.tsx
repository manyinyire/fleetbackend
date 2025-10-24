'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateTenantSettings } from '@/server/actions/settings';
import { toast } from 'react-hot-toast';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid hex color'),
  invoicePrefix: z.string().min(1).max(10),
  invoiceFooter: z.string().optional(),
  taxNumber: z.string().optional(),
  bankDetails: z.string().optional(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
  dateFormat: z.string().min(1),
  country: z.string().min(1),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialData: any;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: initialData?.companyName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      logoUrl: initialData?.logoUrl || '',
      primaryColor: initialData?.primaryColor || '#1e3a8a',
      invoicePrefix: initialData?.invoicePrefix || 'INV',
      invoiceFooter: initialData?.invoiceFooter || '',
      taxNumber: initialData?.taxNumber || '',
      bankDetails: initialData?.bankDetails || '',
      currency: initialData?.currency || 'USD',
      timezone: initialData?.timezone || 'Africa/Harare',
      dateFormat: initialData?.dateFormat || 'YYYY-MM-DD',
      country: initialData?.country || 'Zimbabwe',
      emailNotifications: initialData?.emailNotifications ?? true,
      smsNotifications: initialData?.smsNotifications ?? false,
    },
  });

  async function onSubmit(data: SettingsFormData) {
    setLoading(true);
    try {
      await updateTenantSettings(data);
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Branding Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Branding</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Company Name
            </label>
            <input
              {...form.register('companyName')}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {form.formState.errors.companyName && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.companyName.message}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                {...form.register('primaryColor')}
                className="w-16 h-10 border rounded"
              />
              <input
                type="text"
                {...form.register('primaryColor')}
                placeholder="#1e3a8a"
                className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Logo URL
            </label>
            <input
              {...form.register('logoUrl')}
              placeholder="https://example.com/logo.png"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload logo to your storage and paste URL here
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              {...form.register('email')}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Phone
            </label>
            <input
              {...form.register('phone')}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Address
            </label>
            <input
              {...form.register('address')}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              City
            </label>
            <input
              {...form.register('city')}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Country
            </label>
            <input
              {...form.register('country')}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Invoice Settings Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Invoice Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Invoice Prefix
            </label>
            <input
              {...form.register('invoicePrefix')}
              placeholder="INV"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              E.g., "INV" will generate INV-202510-001
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Tax Number / VAT
            </label>
            <input
              {...form.register('taxNumber')}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Invoice Footer
            </label>
            <textarea
              {...form.register('invoiceFooter')}
              rows={3}
              placeholder="Thank you for your business!"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Bank Details (for invoices)
            </label>
            <textarea
              {...form.register('bankDetails')}
              rows={3}
              placeholder="Bank Name: ...\nAccount Number: ...\nSwift Code: ..."
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              {...form.register('emailNotifications')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Email notifications
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              {...form.register('smsNotifications')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              SMS notifications
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => form.reset()}
          className="px-6 py-2 border rounded-md hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}