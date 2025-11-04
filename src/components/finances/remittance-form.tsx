'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRemittance, updateRemittance, getRemainingBalance, type CreateRemittanceInput } from '@/server/actions/remittances';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { CalendarIcon, CurrencyDollarIcon, PhotoIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ChevronUpIcon } from '@/assets/icons';
import { isTargetReached } from '@/lib/remittance-target';

const remittanceFormSchema = z.object({
  driverId: z.string().min(1, 'Driver is required'),
  amount: z.coerce.number().gt(0, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  proofOfPayment: z.string().optional(),
  notes: z.string().optional(),
});

type RemittanceFormData = z.infer<typeof remittanceFormSchema>;

interface Driver {
  id: string;
  fullName: string;
  vehicles?: {
    id: string;
    vehicle: {
      id: string;
      registrationNumber: string;
      make: string;
      model: string;
      paymentModel?: string;
      paymentConfig?: any;
    };
    endDate: string | null;
  }[];
}

interface RemittanceFormProps {
  drivers: Driver[];
  remittance?: any; // For editing existing remittance
  onSuccess?: () => void;
}

export function RemittanceForm({ drivers, remittance, onSuccess }: RemittanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<RemittanceFormData>({
    resolver: zodResolver(remittanceFormSchema),
    defaultValues: {
      driverId: remittance?.driverId || '',
      amount: remittance?.amount || 0,
      date: remittance?.date ? new Date(remittance.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: remittance?.status || 'PENDING',
      proofOfPayment: remittance?.proofOfPayment || '',
      notes: remittance?.notes || '',
    },
  });

  const selectedDriverId = watch('driverId');
  const amount = watch('amount');
  const date = watch('date');

  // State for remaining balance info
  const [balanceInfo, setBalanceInfo] = useState<{
    fullTarget: number | null;
    existingSum: number;
    remainingBalance: number | null;
    frequency?: string;
  } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Find selected driver and their active vehicle
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find(d => d.id === selectedDriverId);
      setSelectedDriver(driver || null);
    } else {
      setSelectedDriver(null);
      setBalanceInfo(null);
    }
  }, [selectedDriverId, drivers]);

  // Get active vehicle for selected driver
  const activeVehicle = selectedDriver?.vehicles?.find(v => !v.endDate)?.vehicle;

  // Fetch remaining balance when driver, vehicle, or date changes
  useEffect(() => {
    if (!activeVehicle || !selectedDriverId || !date) {
      setBalanceInfo(null);
      return;
    }

    const fetchBalance = async () => {
      setLoadingBalance(true);
      try {
        const balance = await getRemainingBalance(
          selectedDriverId,
          activeVehicle.id,
          new Date(date)
        );
        setBalanceInfo(balance);
      } catch (error) {
        console.error('Error fetching remaining balance:', error);
        setBalanceInfo(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [selectedDriverId, activeVehicle?.id, date]);

  // Calculate target amount and check if reached
  const targetInfo = useMemo(() => {
    if (!balanceInfo) {
      return { targetAmount: null, targetReached: false, fullTarget: null, existingSum: 0 };
    }
    
    const targetAmount = balanceInfo.remainingBalance; // Use remaining balance as target
    const targetReached = amount && targetAmount ? isTargetReached(amount, targetAmount) : false;
    
    return { 
      targetAmount, 
      targetReached,
      fullTarget: balanceInfo.fullTarget,
      existingSum: balanceInfo.existingSum,
      frequency: balanceInfo.frequency,
    };
  }, [balanceInfo, amount]);

  const onSubmit = async (data: RemittanceFormData) => {
    setLoading(true);
    try {
      if (!activeVehicle) {
        toast.error('Selected driver has no active vehicle assignment');
        return;
      }

      if (remittance) {
        // Update existing remittance
        await updateRemittance({
          id: remittance.id,
          ...data,
          vehicleId: activeVehicle.id,
          date: new Date(data.date),
        });
        toast.success('Remittance updated successfully!');
      } else {
        // Create new remittance
        await createRemittance({
          ...data,
          vehicleId: activeVehicle.id,
          date: new Date(data.date),
        });
        toast.success('Remittance created successfully!');
      }
      
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
        router.push('/remittances');
      }
    } catch (error) {
      console.error('Remittance form error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save remittance');
    } finally {
      setLoading(false);
    }
  };

  // Get drivers without vehicle assignments
  const driversWithoutVehicles = drivers.filter(
    driver => !driver.vehicles?.some(v => !v.endDate)
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {driversWithoutVehicles.length > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-600">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                The following drivers are not available for remittances because they don&apos;t have an assigned vehicle:
              </p>
              <ul className="mt-2 list-disc list-inside text-sm text-yellow-700">
                {driversWithoutVehicles.map(driver => (
                  <li key={driver.id}>{driver.fullName}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Driver Selection */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Driver *
          </label>
          <div className="relative">
            <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              {...register('driverId')}
              className="w-full appearance-none rounded-lg border border-stroke bg-transparent pl-11.5 pr-11.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
            >
              <option value="">Select a driver</option>
              {drivers
                .filter(driver => driver.vehicles?.some(v => !v.endDate))
                .map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.fullName}
                  </option>
                ))}
            </select>
            <ChevronUpIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-180" />
          </div>
          {errors.driverId && (
            <p className="text-sm text-red-600 mt-1">{errors.driverId.message}</p>
          )}
        </div>

        {/* Vehicle Display (Read-only) */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Assigned Vehicle
          </label>
          <div className="rounded-lg border border-stroke bg-transparent px-5.5 py-3 text-dark placeholder:text-dark-6 dark:border-dark-3 dark:bg-dark-2 dark:text-white">
            {activeVehicle ? (
              <div className="flex items-center gap-2">
                <span className="text-dark dark:text-white font-medium">
                  {activeVehicle.registrationNumber}
                </span>
                <span className="text-dark-6 dark:text-dark-6">
                  - {activeVehicle.make} {activeVehicle.model}
                </span>
              </div>
            ) : (
              <span className={`${selectedDriverId ? 'text-red-600 dark:text-red-400' : 'text-dark-6 dark:text-dark-6'}`}>
                {selectedDriverId ? '⚠️ No active vehicle assignment' : 'Select a driver first'}
              </span>
            )}
          </div>
          {!activeVehicle && selectedDriverId && (
            <p className="text-xs text-red-600 mt-1">
              This driver must have an assigned vehicle to create a remittance
            </p>
          )}
        </div>

                 {/* Amount */}
         <div>
           <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
             Amount *
           </label>
           <div className="relative">
             <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
             <input
               {...register('amount')}
               type="number"
               placeholder="0.00"
               step="0.01"
               min="0"
               className="w-full appearance-none rounded-lg border border-stroke bg-transparent pl-11.5 pr-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
             />
           </div>
           {errors.amount && (
             <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
           )}
           
           {/* Target Amount Display */}
           {activeVehicle && targetInfo.targetAmount !== null && !loadingBalance && (
             <div className="mt-3 rounded-lg border border-stroke bg-gray-50 dark:bg-dark-2 dark:border-dark-3 px-4 py-3">
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-dark dark:text-white">
                       {targetInfo.frequency === 'WEEKLY' ? 'Weekly' : targetInfo.frequency === 'MONTHLY' ? 'Monthly' : 'Daily'} Target:
                     </span>
                     <span className="text-sm text-dark-6 dark:text-dark-6">
                       {targetInfo.fullTarget?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                     </span>
                   </div>
                 </div>
                 {targetInfo.existingSum > 0 && (
                   <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                     <span>Already remitted this period:</span>
                     <span className="font-medium">{targetInfo.existingSum.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                   </div>
                 )}
                 <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-semibold text-dark dark:text-white">
                       Remaining Balance:
                     </span>
                     <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                       {targetInfo.targetAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     {targetInfo.targetReached ? (
                       <>
                         <CheckCircleIcon className="h-5 w-5 text-green-600" />
                         <span className="text-sm font-medium text-green-600">Target Reached</span>
                       </>
                     ) : (
                       <>
                         <XCircleIcon className="h-5 w-5 text-orange-600" />
                         <span className="text-sm font-medium text-orange-600">Target Not Met</span>
                       </>
                     )}
                   </div>
                 </div>
                 {!targetInfo.targetReached && amount && targetInfo.targetAmount > 0 && (
                   <p className="text-xs text-orange-600 mt-1">
                     Need {((targetInfo.targetAmount || 0) - amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} more to reach target
                   </p>
                 )}
               </div>
             </div>
           )}
           {loadingBalance && (
             <div className="mt-3 text-xs text-gray-500">Calculating remaining balance...</div>
           )}
         </div>

                 {/* Date */}
         <div>
           <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
             Date *
           </label>
           <div className="relative">
             <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
             <input
               {...register('date')}
               type="date"
               className="w-full appearance-none rounded-lg border border-stroke bg-transparent pl-11.5 pr-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
             />
           </div>
           {errors.date && (
             <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
           )}
         </div>

        {/* Status */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Status
          </label>
          <div className="relative">
            <select
              {...register('status')}
              className="w-full appearance-none rounded-lg border border-stroke bg-transparent px-5.5 py-3 pr-11.5 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronUpIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-180" />
          </div>
          {errors.status && (
            <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
          )}
        </div>

                 {/* Proof of Payment */}
         <div>
           <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
             Proof of Payment URL
           </label>
           <div className="relative">
             <PhotoIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
             <input
               {...register('proofOfPayment')}
               type="url"
               placeholder="https://example.com/receipt.jpg"
               className="w-full appearance-none rounded-lg border border-stroke bg-transparent pl-11.5 pr-4 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
             />
           </div>
           {errors.proofOfPayment && (
             <p className="text-sm text-red-600 mt-1">{errors.proofOfPayment.message}</p>
           )}
         </div>
       </div>

             {/* Notes */}
       <div>
         <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
           Notes
         </label>
         <textarea
           {...register('notes')}
           rows={6}
           placeholder="Additional notes about this remittance..."
           className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
         />
       </div>
       {errors.notes && (
         <p className="text-sm text-red-600">{errors.notes.message}</p>
       )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading || !activeVehicle}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            remittance ? 'Update Remittance' : 'Create Remittance'
          )}
        </button>
      </div>
    </form>
  );
}
