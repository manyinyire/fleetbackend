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
  paymentModel: z.enum(['OWNER_PAYS', 'DRIVER_REMITS', 'HYBRID']),
  // Owner Pays fields
  ownerPaysPercentage: z.coerce.number().min(0).max(100).optional(),
  ownerPaysClosingDay: z.string().optional(),
  // Driver Remits fields
  driverRemitsAmount: z.coerce.number().min(0).optional(),
  driverRemitsFrequency: z.string().optional(),
  // Hybrid fields
  hybridBaseAmount: z.coerce.number().min(0).optional(),
  hybridCommissionPercentage: z.coerce.number().min(0).max(100).optional(),
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
      paymentModel: 'DRIVER_REMITS',
      ownerPaysPercentage: 70,
      ownerPaysClosingDay: 'FRIDAY',
      driverRemitsAmount: 100,
      driverRemitsFrequency: 'DAILY',
      hybridBaseAmount: 500,
      hybridCommissionPercentage: 10,
      debtBalance: 0,
      status: 'ACTIVE',
    },
  });

  const paymentModel = form.watch('paymentModel');
  const hasDefensiveLicense = form.watch('hasDefensiveLicense');

  async function onSubmit(data: DriverFormData) {
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

      {/* Payment Configuration */}
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="border-b border-stroke px-7 py-4 dark:border-dark-3">
          <h3 className="font-medium text-dark dark:text-white">
            Payment Configuration
          </h3>
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

          <div className="mt-5.5 flex flex-col gap-5.5 sm:flex-row">
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
                disabled={paymentModel === 'DRIVER_REMITS'}
                {...form.register('debtBalance')}
              />
              {form.formState.errors.debtBalance && (
                <p className="mt-1 text-body-sm text-red">
                  {form.formState.errors.debtBalance.message}
                </p>
              )}
              {paymentModel === 'DRIVER_REMITS' && (
                <p className="mt-1 text-body-sm text-dark-6 italic">
                  Drivers under &quot;Driver Remits&quot; model don&apos;t have salary debt
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
