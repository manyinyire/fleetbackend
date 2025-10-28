'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, CurrencyDollarIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required'),
  date: z.string().min(1, 'Date is required'),
  mileage: z.coerce.number().int().min(0, 'Mileage must be non-negative'),
  type: z.enum(['ROUTINE_SERVICE', 'TIRE_REPLACEMENT', 'BRAKE_SERVICE', 'ENGINE_REPAIR', 'ELECTRICAL', 'BODY_WORK', 'OTHER']),
  description: z.string().min(1, 'Description is required'),
  cost: z.coerce.number().positive('Cost must be greater than 0'),
  provider: z.string().min(1, 'Provider is required'),
  invoice: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
  currentMileage: number;
}

interface MaintenanceFormProps {
  vehicles: Vehicle[];
  vehicleId?: string;
  onSuccess?: () => void;
}

export function MaintenanceForm({ vehicles, vehicleId, onSuccess }: MaintenanceFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Find the selected vehicle to auto-populate mileage
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      vehicleId: vehicleId || '',
      date: new Date().toISOString().split('T')[0],
      mileage: selectedVehicle?.currentMileage || 0,
      type: 'ROUTINE_SERVICE',
      description: '',
      cost: 0,
      provider: '',
      invoice: '',
    },
  });

  // Watch for vehicle selection changes to update mileage
  const selectedVehicleId = form.watch('vehicleId');
  
  // Update mileage when vehicle changes
  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = e.target.value;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      form.setValue('mileage', vehicle.currentMileage);
    }
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create maintenance record');
      }

      toast.success('Maintenance record created successfully!');
      form.reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
        router.push('/maintenance');
      }
    } catch (error) {
      console.error('Maintenance form error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save maintenance record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5.5">
      {/* Vehicle Selection */}
      <div>
        <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
          Vehicle *
        </label>
        <select
          {...form.register('vehicleId', {
            onChange: handleVehicleChange,
          })}
          className="w-full appearance-none rounded-lg border border-stroke bg-white px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-gray-100"
          disabled={!!vehicleId}
        >
          <option value="">Select a vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
            </option>
          ))}
        </select>
        {form.formState.errors.vehicleId && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.vehicleId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5.5 sm:grid-cols-2">
        {/* Date */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Date *
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...form.register('date')}
              type="date"
              className="w-full appearance-none rounded-lg border border-stroke bg-white pl-11 pr-4.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
          {form.formState.errors.date && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.date.message}</p>
          )}
        </div>

        {/* Mileage */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Mileage *
          </label>
          <input
            {...form.register('mileage')}
            type="number"
            placeholder="0"
            className="w-full rounded-lg border border-stroke bg-white px-4.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          />
          {form.formState.errors.mileage && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.mileage.message}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Type *
          </label>
          <div className="relative">
            <WrenchScrewdriverIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              {...form.register('type')}
              className="w-full appearance-none rounded-lg border border-stroke bg-white pl-11 pr-4.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            >
              <option value="ROUTINE_SERVICE">Routine Service</option>
              <option value="TIRE_REPLACEMENT">Tire Replacement</option>
              <option value="BRAKE_SERVICE">Brake Service</option>
              <option value="ENGINE_REPAIR">Engine Repair</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="BODY_WORK">Body Work</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          {form.formState.errors.type && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.type.message}</p>
          )}
        </div>

        {/* Cost */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Cost *
          </label>
          <div className="relative">
            <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...form.register('cost')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full appearance-none rounded-lg border border-stroke bg-white pl-11 pr-4.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
          {form.formState.errors.cost && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.cost.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
          Description *
        </label>
        <textarea
          {...form.register('description')}
          rows={4}
          placeholder="Describe the maintenance performed..."
          className="w-full rounded-lg border border-stroke bg-white px-4.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Provider */}
      <div>
        <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
          Service Provider *
        </label>
        <input
          {...form.register('provider')}
          type="text"
          placeholder="Enter service provider name"
          className="w-full rounded-lg border border-stroke bg-white px-4.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />
        {form.formState.errors.provider && (
          <p className="text-sm text-red-600 mt-1">{form.formState.errors.provider.message}</p>
        )}
      </div>

      {/* Invoice URL */}
      <div>
        <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
          Invoice URL (optional)
        </label>
        <input
          {...form.register('invoice')}
          type="url"
          placeholder="https://example.com/invoice.pdf"
          className="w-full rounded-lg border border-stroke bg-white px-4.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-5.5 py-3 text-center font-medium text-gray hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Maintenance Record'}
      </button>
    </form>
  );
}
