'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const driverSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  nationalId: z.string().min(5, 'National ID is required'),
  licenseNumber: z.string().min(5, 'License number is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  // Payment configuration is now set on vehicles - drivers inherit it when assigned
});

type DriverFormData = z.infer<typeof driverSchema>;

interface AddDriverStepProps {
  onComplete: (driverId: string) => void;
}

export function AddDriverStep({ onComplete }: AddDriverStepProps) {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      licenseNumber: '',
      licenseExpiry: '',
      phone: '',
      email: '',
    },
  });

  async function onSubmit(data: DriverFormData) {
    setLoading(true);
    
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          licenseExpiry: new Date(data.licenseExpiry),
          email: data.email || null,
          // Payment configuration is now set on vehicles - will be inherited when assigned
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create driver');
      }

      const result = await response.json();
      onComplete(result.id);
    } catch (error) {
      console.error('Driver creation error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Your First Driver</h2>
      <p className="text-gray-600 mb-8">
        Now let&apos;s add a driver who will be assigned to your vehicle.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              {...form.register('fullName')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="John Doe"
            />
            {form.formState.errors.fullName && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              National ID *
            </label>
            <input
              {...form.register('nationalId')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="1234567890"
            />
            {form.formState.errors.nationalId && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.nationalId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number *
            </label>
            <input
              {...form.register('licenseNumber')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="DL123456789"
            />
            {form.formState.errors.licenseNumber && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.licenseNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Expiry *
            </label>
            <input
              {...form.register('licenseExpiry')}
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {form.formState.errors.licenseExpiry && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.licenseExpiry.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              {...form.register('phone')}
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+263 77 123 4567"
            />
            {form.formState.errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              {...form.register('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="john@example.com"
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Payment configuration is now set on vehicles. 
                When you assign this driver to a vehicle, they will inherit the vehicle&apos;s payment settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Driver...' : 'Add Driver'}
          </button>
        </div>
      </form>
    </div>
  );
}