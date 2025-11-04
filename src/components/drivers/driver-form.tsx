'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createDriver, type CreateDriverInput } from '@/server/actions/drivers';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const driverFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nationalId: z.string().min(1, 'National ID is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  homeAddress: z.string().min(1, 'Home address is required'),
  nextOfKin: z.string().min(1, 'Next of kin is required'),
  nextOfKinPhone: z.string().min(1, 'Next of kin phone is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  hasDefensiveLicense: z.boolean().default(false),
  defensiveLicenseNumber: z.string().optional(),
  defensiveLicenseExpiry: z.string().optional(),
  // Payment configuration is now on Vehicle - drivers inherit it when assigned
  debtBalance: z.coerce.number().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).default('ACTIVE'),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

export function DriverForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      homeAddress: '',
      nextOfKin: '',
      nextOfKinPhone: '',
      licenseNumber: '',
      hasDefensiveLicense: false,
      defensiveLicenseNumber: '',
      defensiveLicenseExpiry: '',
      debtBalance: 0,
      status: 'ACTIVE',
    },
  });

  const hasDefensiveLicense = form.watch('hasDefensiveLicense');

  async function onSubmit(data: DriverFormData) {
    setLoading(true);
    try {
      const driverData: any = {
        fullName: data.fullName,
        nationalId: data.nationalId,
        licenseNumber: data.licenseNumber,
        phone: data.phone,
        email: data.email,
        homeAddress: data.homeAddress,
        nextOfKin: data.nextOfKin,
        nextOfKinPhone: data.nextOfKinPhone,
        hasDefensiveLicense: data.hasDefensiveLicense,
        defensiveLicenseNumber: data.hasDefensiveLicense ? data.defensiveLicenseNumber : undefined,
        defensiveLicenseExpiry: data.hasDefensiveLicense && data.defensiveLicenseExpiry
          ? new Date(data.defensiveLicenseExpiry)
          : undefined,
        // Payment configuration is now on Vehicle - drivers inherit it when assigned
        debtBalance: data.debtBalance,
        status: data.status,
      };

      await createDriver(driverData as CreateDriverInput);
      toast.success('Driver created successfully!');
      router.push('/drivers');
    } catch (error) {
      console.error('Driver creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create driver');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Personal Information
          </h3>
        </div>
        <div className="p-7">
          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="fullName"
              >
                Full Name <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                id="fullName"
                placeholder="John Doe"
                {...form.register('fullName')}
              />
              {form.formState.errors.fullName && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="nationalId"
              >
                National ID <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                id="nationalId"
                placeholder="63-123456X21"
                {...form.register('nationalId')}
              />
              {form.formState.errors.nationalId && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.nationalId.message}
                </p>
              )}
            </div>
          </div>

          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="phone"
              >
                Phone Number <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="tel"
                id="phone"
                placeholder="+263 77 123 4567"
                {...form.register('phone')}
              />
              {form.formState.errors.phone && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="email"
              >
                Email (Optional)
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="email"
                id="email"
                placeholder="john@example.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="mb-5.5">
            <label
              className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
              htmlFor="homeAddress"
            >
              Home Address <span className="text-red">*</span>
            </label>
            <textarea
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              id="homeAddress"
              rows={3}
              placeholder="123 Main Street, City"
              {...form.register('homeAddress')}
            />
            {form.formState.errors.homeAddress && (
              <p className="mt-1 text-body-sm text-red">
                {form.formState.errors.homeAddress.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Emergency Contact
          </h3>
        </div>
        <div className="p-7">
          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="nextOfKin"
              >
                Next of Kin <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="text"
                id="nextOfKin"
                placeholder="Jane Doe"
                {...form.register('nextOfKin')}
              />
              {form.formState.errors.nextOfKin && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.nextOfKin.message}
                </p>
              )}
            </div>

            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="nextOfKinPhone"
              >
                Next of Kin Phone <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="tel"
                id="nextOfKinPhone"
                placeholder="+263 77 123 4567"
                {...form.register('nextOfKinPhone')}
              />
              {form.formState.errors.nextOfKinPhone && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.nextOfKinPhone.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* License Information */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            License Information
          </h3>
        </div>
        <div className="p-7">
          <div className="mb-5.5">
            <label
              className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
              htmlFor="licenseNumber"
            >
              Driver&apos;s License Number <span className="text-red">*</span>
            </label>
            <input
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              type="text"
              id="licenseNumber"
              placeholder="DL123456"
              {...form.register('licenseNumber')}
            />
            {form.formState.errors.licenseNumber && (
              <p className="mt-1 text-body-sm text-red">
                {form.formState.errors.licenseNumber.message}
              </p>
            )}
          </div>

          <div className="mb-5.5">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3"
                {...form.register('hasDefensiveLicense')}
              />
              <span className="text-body-sm font-medium text-dark dark:text-white">
                Has Defensive Driver&apos;s License (Required for Commuter Omnibus)
              </span>
            </label>
          </div>

          {hasDefensiveLicense && (
            <div className="flex flex-col gap-5.5 sm:flex-row">
              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="defensiveLicenseNumber"
                >
                  Defensive License Number <span className="text-red">*</span>
                </label>
                <input
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  type="text"
                  id="defensiveLicenseNumber"
                  placeholder="DDL123456"
                  {...form.register('defensiveLicenseNumber')}
                />
                {form.formState.errors.defensiveLicenseNumber && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.defensiveLicenseNumber.message}
                  </p>
                )}
              </div>

              <div className="w-full sm:w-1/2">
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="defensiveLicenseExpiry"
                >
                  Defensive License Expiry <span className="text-red">*</span>
                </label>
                <input
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  type="date"
                  id="defensiveLicenseExpiry"
                  {...form.register('defensiveLicenseExpiry')}
                />
                {form.formState.errors.defensiveLicenseExpiry && (
                  <p className="mt-1 text-body-sm text-red">
                    {form.formState.errors.defensiveLicenseExpiry.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Driver Status and Debt Balance */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Status & Debt Balance
          </h3>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
            Payment configuration is set on the vehicle. Drivers inherit it when assigned.
          </p>
        </div>
        <div className="p-7">
          <div className="flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label
                className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                htmlFor="debtBalance"
              >
                Initial Debt Balance ($)
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition placeholder:text-dark-6 focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                type="number"
                id="debtBalance"
                step="0.01"
                placeholder="0.00"
                {...form.register('debtBalance')}
              />
              {form.formState.errors.debtBalance && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.debtBalance.message}
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
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
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
          {loading ? 'Creating...' : 'Create Driver'}
        </button>
      </div>
    </form>
  );
}
