'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  type: z.enum(['CAR', 'OMNIBUS', 'BIKE']),
  initialCost: z.number().min(0, 'Initial cost must be positive'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface AddVehicleStepProps {
  onComplete: (vehicleId: string) => void;
}

export function AddVehicleStep({ onComplete }: AddVehicleStepProps) {
  const [loading, setLoading] = useState(false);
  
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'CAR',
      initialCost: 0,
    },
  });

  async function onSubmit(data: VehicleFormData) {
    setLoading(true);
    
    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create vehicle');
      }

      const result = await response.json();
      onComplete(result.id);
    } catch (error) {
      console.error('Vehicle creation error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Your First Vehicle</h2>
      <p className="text-gray-600 mb-8">
        Let&apos;s start by adding your first vehicle to the fleet management system.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Number *
            </label>
            <input
              {...form.register('registrationNumber')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="ABC-1234"
            />
            {form.formState.errors.registrationNumber && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.registrationNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type *
            </label>
            <select
              {...form.register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="CAR">Car</option>
              <option value="OMNIBUS">Omnibus (Kombi)</option>
              <option value="BIKE">Bike</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Make *
            </label>
            <input
              {...form.register('make')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Toyota"
            />
            {form.formState.errors.make && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.make.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <input
              {...form.register('model')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Corolla"
            />
            {form.formState.errors.model && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.model.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <input
              {...form.register('year', { valueAsNumber: true })}
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {form.formState.errors.year && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.year.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Cost (USD) *
            </label>
            <input
              {...form.register('initialCost', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
            {form.formState.errors.initialCost && (
              <p className="mt-1 text-sm text-red-600">
                {form.formState.errors.initialCost.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}