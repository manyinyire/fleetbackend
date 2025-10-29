'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createVehicle, type CreateVehicleInput } from '@/server/actions/vehicles';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const vehicleFormSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  type: z.enum(['CAR', 'OMNIBUS', 'BIKE']),
  initialCost: z.coerce.number().positive('Initial cost must be positive'),
  currentMileage: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED']).default('ACTIVE'),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

export function VehicleForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      registrationNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'CAR',
      initialCost: 0,
      currentMileage: 0,
      status: 'ACTIVE',
    },
  });

  async function onSubmit(data: VehicleFormData) {
    setLoading(true);
    try {
      await createVehicle(data as CreateVehicleInput);
      toast.success('Vehicle created successfully!');
      router.push('/vehicles');
    } catch (error) {
      console.error('Vehicle creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create vehicle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Vehicle Information
          </h3>
        </div>
        <div className="p-7">
          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="registrationNumber"
              >
                Registration Number <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                id="registrationNumber"
                placeholder="ABC-1234"
                {...form.register('registrationNumber')}
              />
              {form.formState.errors.registrationNumber && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.registrationNumber.message}
                </p>
              )}
            </div>

            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="type"
              >
                Vehicle Type <span className="text-red">*</span>
              </label>
              <select
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                id="type"
                {...form.register('type')}
              >
                <option value="CAR">Car</option>
                <option value="OMNIBUS">Omnibus</option>
                <option value="BIKE">Bike</option>
              </select>
              {form.formState.errors.type && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.type.message}
                </p>
              )}
            </div>
          </div>

          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="make"
              >
                Make <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                id="make"
                placeholder="Toyota"
                {...form.register('make')}
              />
              {form.formState.errors.make && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.make.message}
                </p>
              )}
            </div>

            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="model"
              >
                Model <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                id="model"
                placeholder="Camry"
                {...form.register('model')}
              />
              {form.formState.errors.model && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.model.message}
                </p>
              )}
            </div>
          </div>

          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="year"
              >
                Year <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="number"
                id="year"
                placeholder="2024"
                {...form.register('year')}
              />
              {form.formState.errors.year && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.year.message}
                </p>
              )}
            </div>

            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="initialCost"
              >
                Initial Cost ($) <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="number"
                id="initialCost"
                placeholder="25000"
                step="0.01"
                {...form.register('initialCost')}
              />
              {form.formState.errors.initialCost && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.initialCost.message}
                </p>
              )}
            </div>
          </div>

          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="currentMileage"
              >
                Current Mileage (km)
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="number"
                id="currentMileage"
                placeholder="0"
                {...form.register('currentMileage')}
              />
              {form.formState.errors.currentMileage && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.currentMileage.message}
                </p>
              )}
            </div>

            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="status"
              >
                Status
              </label>
              <select
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                id="status"
                {...form.register('status')}
              >
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="DECOMMISSIONED">Decommissioned</option>
              </select>
              {form.formState.errors.status && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex justify-center rounded-[7px] border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex justify-center rounded-[7px] bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Vehicle'}
        </button>
      </div>
    </form>
  );
}
