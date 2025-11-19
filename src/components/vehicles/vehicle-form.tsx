'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createVehicle, type CreateVehicleInput } from '@/server/actions/vehicles';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { vehicleFormSchema, type VehicleFormData } from '@/lib/schemas/vehicle';

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
      paymentModel: 'DRIVER_REMITS',
      ownerPaysPercentage: 70,
      ownerPaysClosingDay: 'FRIDAY',
      driverRemitsAmount: 100,
      driverRemitsFrequency: 'DAILY',
      hybridBaseAmount: 500,
      hybridCommissionPercentage: 10,
    },
  });

  const paymentModel = form.watch('paymentModel');

  async function onSubmit(data: VehicleFormData) {
    setLoading(true);
    try {
      // Build payment config based on payment model
      let paymentConfig: any = {};

      switch (data.paymentModel) {
        case 'OWNER_PAYS':
          paymentConfig = {
            percentage: data.ownerPaysPercentage,
            closingDay: data.ownerPaysClosingDay,
          };
          break;
        case 'DRIVER_REMITS':
          paymentConfig = {
            amount: data.driverRemitsAmount,
            frequency: data.driverRemitsFrequency,
          };
          break;
        case 'HYBRID':
          paymentConfig = {
            baseAmount: data.hybridBaseAmount,
            commissionPercentage: data.hybridCommissionPercentage,
          };
          break;
      }

      const vehicleData: any = {
        registrationNumber: data.registrationNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        type: data.type,
        initialCost: data.initialCost,
        currentMileage: data.currentMileage,
        status: data.status,
        paymentModel: data.paymentModel,
        paymentConfig,
      };

      await createVehicle(vehicleData as CreateVehicleInput);
      toast.success('Vehicle created successfully!');
      router.push('/vehicles');
    } catch (error: any) {
      console.error('Vehicle creation error:', error);

      // Check if it's a limit exceeded error
      if (error.code === 'LIMIT_EXCEEDED') {
        toast.error(
          <div>
            <p className="font-semibold">{error.message}</p>
            {error.upgradeMessage && (
              <p className="mt-1 text-sm">{error.upgradeMessage}</p>
            )}
            <button
              onClick={() => router.push('/billing')}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Upgrade Now
            </button>
          </div>,
          { duration: 8000 }
        );
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to create vehicle');
      }
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

      {/* Payment Configuration */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Payment Configuration
          </h3>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            Drivers assigned to this vehicle will inherit these payment settings
          </p>
        </div>
        <div className="p-7">
          <div className="mb-5.5">
            <label
              className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
              htmlFor="paymentModel"
            >
              Payment Model <span className="text-red">*</span>
            </label>
            <select
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              id="paymentModel"
              {...form.register('paymentModel')}
            >
              <option value="OWNER_PAYS">Owner Pays (Percentage-based)</option>
              <option value="DRIVER_REMITS">Driver Remits (Fixed Target)</option>
              <option value="HYBRID">Hybrid (Base + Performance)</option>
            </select>
            {form.formState.errors.paymentModel && (
              <p className="mt-1 text-body-sm text-red">
                {form.formState.errors.paymentModel.message}
              </p>
            )}
          </div>

          {/* Owner Pays Configuration */}
          {paymentModel === 'OWNER_PAYS' && (
            <div className="flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="ownerPaysPercentage"
                >
                  Percentage (%) <span className="text-red">*</span>
                </label>
                <input
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  type="number"
                  id="ownerPaysPercentage"
                  step="0.01"
                  max="100"
                  placeholder="70"
                  {...form.register('ownerPaysPercentage')}
                />
                {form.formState.errors.ownerPaysPercentage && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.ownerPaysPercentage.message}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="ownerPaysClosingDay"
                >
                  Week Closing Day <span className="text-red">*</span>
                </label>
                <select
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  id="ownerPaysClosingDay"
                  {...form.register('ownerPaysClosingDay')}
                >
                  <option value="MONDAY">Monday</option>
                  <option value="TUESDAY">Tuesday</option>
                  <option value="WEDNESDAY">Wednesday</option>
                  <option value="THURSDAY">Thursday</option>
                  <option value="FRIDAY">Friday</option>
                  <option value="SATURDAY">Saturday</option>
                  <option value="SUNDAY">Sunday</option>
                </select>
                {form.formState.errors.ownerPaysClosingDay && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.ownerPaysClosingDay.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Driver Remits Configuration */}
          {paymentModel === 'DRIVER_REMITS' && (
            <div className="flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="driverRemitsAmount"
                >
                  Target Amount ($) <span className="text-red">*</span>
                </label>
                <input
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  type="number"
                  id="driverRemitsAmount"
                  step="0.01"
                  placeholder="100"
                  {...form.register('driverRemitsAmount')}
                />
                {form.formState.errors.driverRemitsAmount && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.driverRemitsAmount.message}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="driverRemitsFrequency"
                >
                  Frequency <span className="text-red">*</span>
                </label>
                <select
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  id="driverRemitsFrequency"
                  {...form.register('driverRemitsFrequency')}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
                {form.formState.errors.driverRemitsFrequency && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.driverRemitsFrequency.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Hybrid Configuration */}
          {paymentModel === 'HYBRID' && (
            <div className="flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="hybridBaseAmount"
                >
                  Base Amount ($) <span className="text-red">*</span>
                </label>
                <input
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  type="number"
                  id="hybridBaseAmount"
                  step="0.01"
                  placeholder="500"
                  {...form.register('hybridBaseAmount')}
                />
                {form.formState.errors.hybridBaseAmount && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.hybridBaseAmount.message}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="hybridCommissionPercentage"
                >
                  Commission (%) <span className="text-red">*</span>
                </label>
                <input
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  type="number"
                  id="hybridCommissionPercentage"
                  step="0.01"
                  max="100"
                  placeholder="10"
                  {...form.register('hybridCommissionPercentage')}
                />
                {form.formState.errors.hybridCommissionPercentage && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.hybridCommissionPercentage.message}
                  </p>
                )}
              </div>
            </div>
          )}
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
