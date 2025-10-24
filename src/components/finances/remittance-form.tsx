'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createRemittance, updateRemittance, type CreateRemittanceInput } from '@/server/actions/remittances';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import InputGroup from '@/components/FormElements/InputGroup';
import { Select } from '@/components/FormElements/select';
import { TextAreaGroup } from '@/components/FormElements/InputGroup/text-area';
import { CalendarIcon, CurrencyDollarIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';

const remittanceFormSchema = z.object({
  driverId: z.string().min(1, 'Driver is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  proofOfPayment: z.string().optional(),
  notes: z.string().optional(),
});

type RemittanceFormData = z.infer<typeof remittanceFormSchema>;

interface Driver {
  id: string;
  fullName: string;
  vehicles: {
    id: string;
    vehicle: {
      id: string;
      registrationNumber: string;
      make: string;
      model: string;
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

  // Find selected driver and their active vehicle
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find(d => d.id === selectedDriverId);
      setSelectedDriver(driver || null);
    } else {
      setSelectedDriver(null);
    }
  }, [selectedDriverId, drivers]);

  // Get active vehicle for selected driver
  const activeVehicle = selectedDriver?.vehicles.find(v => !v.endDate)?.vehicle;

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Driver Selection */}
        <Select
          label="Driver"
          placeholder="Select a driver"
          items={drivers.map(driver => ({
            value: driver.id,
            label: driver.fullName
          }))}
          defaultValue={remittance?.driverId || ''}
          prefixIcon={<CurrencyDollarIcon className="h-5 w-5 text-gray-400" />}
        />

        {/* Vehicle Display (Read-only) */}
        <div>
          <label className="block text-body-sm font-medium text-dark dark:text-white mb-3">
            Assigned Vehicle
          </label>
          <div className="rounded-lg border border-stroke bg-transparent px-5.5 py-3 text-dark placeholder:text-dark-6 dark:border-dark-3 dark:bg-dark-2 dark:text-white">
            {activeVehicle ? (
              <span className="text-dark dark:text-white">
                {activeVehicle.registrationNumber} - {activeVehicle.make} {activeVehicle.model}
              </span>
            ) : (
              <span className="text-dark-6 dark:text-dark-6">
                {selectedDriverId ? 'No active vehicle assignment' : 'Select a driver first'}
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <InputGroup
          label="Amount"
          type="number"
          placeholder="0.00"
          required
          icon={<CurrencyDollarIcon className="h-5 w-5 text-gray-400" />}
          iconPosition="left"
          {...register('amount')}
        />
        {errors.amount && (
          <p className="text-sm text-red-600">{errors.amount.message}</p>
        )}

        {/* Date */}
        <InputGroup
          label="Date"
          type="date"
          placeholder=""
          required
          icon={<CalendarIcon className="h-5 w-5 text-gray-400" />}
          iconPosition="left"
          {...register('date')}
        />
        {errors.date && (
          <p className="text-sm text-red-600">{errors.date.message}</p>
        )}

        {/* Status */}
        <Select
          label="Status"
          placeholder="Select status"
          items={[
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' }
          ]}
          defaultValue={remittance?.status || 'PENDING'}
        />

        {/* Proof of Payment */}
        <InputGroup
          label="Proof of Payment URL"
          type="url"
          placeholder="https://example.com/receipt.jpg"
          icon={<PhotoIcon className="h-5 w-5 text-gray-400" />}
          iconPosition="left"
          {...register('proofOfPayment')}
        />
        {errors.proofOfPayment && (
          <p className="text-sm text-red-600">{errors.proofOfPayment.message}</p>
        )}
      </div>

      {/* Notes */}
      <TextAreaGroup
        label="Notes"
        placeholder="Additional notes about this remittance..."
        defaultValue={remittance?.notes || ''}
      />
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
