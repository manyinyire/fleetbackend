'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateDriver } from '@/server/actions/drivers';
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
  paymentModel: z.enum(['OWNER_PAYS', 'DRIVER_REMITS', 'HYBRID']),
  ownerPaysPercentage: z.coerce.number().min(0).max(100).optional(),
  ownerPaysClosingDay: z.string().optional(),
  driverRemitsAmount: z.coerce.number().min(0).optional(),
  driverRemitsFrequency: z.string().optional(),
  hybridBaseAmount: z.coerce.number().min(0).optional(),
  hybridCommissionPercentage: z.coerce.number().min(0).max(100).optional(),
  debtBalance: z.coerce.number().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']).default('ACTIVE'),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

interface DriverEditFormProps {
  driver: any;
}

export function DriverEditForm({ driver }: DriverEditFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Parse payment config
  const paymentConfig = driver.paymentConfig as any || {};

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      fullName: driver.fullName,
      nationalId: driver.nationalId,
      phone: driver.phone,
      email: driver.email || '',
      homeAddress: driver.homeAddress,
      nextOfKin: driver.nextOfKin,
      nextOfKinPhone: driver.nextOfKinPhone,
      licenseNumber: driver.licenseNumber,
      hasDefensiveLicense: driver.hasDefensiveLicense,
      defensiveLicenseNumber: driver.defensiveLicenseNumber || '',
      defensiveLicenseExpiry: driver.defensiveLicenseExpiry
        ? new Date(driver.defensiveLicenseExpiry).toISOString().split('T')[0]
        : '',
      paymentModel: driver.paymentModel,
      ownerPaysPercentage: paymentConfig.percentage || 70,
      ownerPaysClosingDay: paymentConfig.closingDay || 'FRIDAY',
      driverRemitsAmount: paymentConfig.amount || 100,
      driverRemitsFrequency: paymentConfig.frequency || 'DAILY',
      hybridBaseAmount: paymentConfig.baseAmount || 500,
      hybridCommissionPercentage: paymentConfig.commissionPercentage || 10,
      debtBalance: Number(driver.debtBalance),
      status: driver.status,
    },
  });

  const paymentModel = form.watch('paymentModel');
  const hasDefensiveLicense = form.watch('hasDefensiveLicense');

  async function onSubmit(data: DriverFormData) {
    setLoading(true);
    try {
      // Build payment config
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
        paymentModel: data.paymentModel,
        paymentConfig,
        debtBalance: data.debtBalance,
        status: data.status,
      };

      await updateDriver(driver.id, driverData);
      toast.success('Driver updated successfully!');
      router.push(`/drivers/${driver.id}`);
      router.refresh();
    } catch (error) {
      console.error('Driver update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update driver');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information - Same as create form */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">Personal Information</h3>
        </div>
        <div className="p-7">
          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Full Name <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                type="text"
                {...form.register('fullName')}
              />
              {form.formState.errors.fullName && (
                <p className="mt-1 text-body-sm text-red">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                National ID <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                type="text"
                {...form.register('nationalId')}
              />
              {form.formState.errors.nationalId && (
                <p className="mt-1 text-body-sm text-red">{form.formState.errors.nationalId.message}</p>
              )}
            </div>
          </div>

          <div className="mb-5.5 flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Phone <span className="text-red">*</span>
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                type="tel"
                {...form.register('phone')}
              />
            </div>
            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Email (Optional)
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                type="email"
                {...form.register('email')}
              />
            </div>
          </div>

          <div className="mb-5.5">
            <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
              Home Address <span className="text-red">*</span>
            </label>
            <textarea
              className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              rows={3}
              {...form.register('homeAddress')}
            />
          </div>
        </div>
      </div>

      {/* Status and Debt */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">Status & Debt</h3>
        </div>
        <div className="p-7">
          <div className="flex flex-col gap-5.5 sm:flex-row">
            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Status
              </label>
              <select
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                {...form.register('status')}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div className="w-full sm:w-1/2">
              <label className="mb-3 block text-body-sm font-medium text-dark dark:text-white">
                Debt Balance ($)
              </label>
              <input
                className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                type="number"
                step="0.01"
                disabled={paymentModel === 'DRIVER_REMITS'}
                {...form.register('debtBalance')}
              />
              {paymentModel === 'DRIVER_REMITS' && (
                <p className="mt-1 text-body-sm text-dark-6 italic">
                  Drivers under &quot;Driver Remits&quot; model don&apos;t have salary debt
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
          {loading ? 'Updating...' : 'Update Driver'}
        </button>
      </div>
    </form>
  );
}
