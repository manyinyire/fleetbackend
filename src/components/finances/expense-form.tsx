'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { CalendarIcon, CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const expenseFormSchema = z.object({
  vehicleId: z.string().optional(),
  category: z.enum(['FUEL', 'MAINTENANCE', 'INSURANCE', 'LICENSE', 'SALARY', 'ADMINISTRATIVE', 'LOAN_PAYMENT', 'OTHER']),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  receipt: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
});

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
}

interface ExpenseFormProps {
  vehicles: Vehicle[];
  vehicleId?: string;
  onSuccess?: () => void;
}

export function ExpenseForm({ vehicles, vehicleId, onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      vehicleId: vehicleId || '',
      category: 'OTHER',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      receipt: '',
      status: 'PENDING',
    },
  });

  async function onSubmit(data: ExpenseFormData) {
    setLoading(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          vehicleId: data.vehicleId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create expense');
      }

      toast.success('Expense created successfully!');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Expense creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vehicle (Optional)
          </label>
          <select
            {...form.register('vehicleId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="">Select a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            {...form.register('category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="FUEL">Fuel</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INSURANCE">Insurance</option>
            <option value="LICENSE">License</option>
            <option value="SALARY">Salary</option>
            <option value="ADMINISTRATIVE">Administrative</option>
            <option value="LOAN_PAYMENT">Loan Payment</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              step="0.01"
              {...form.register('amount')}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="0.00"
            />
          </div>
          {form.formState.errors.amount && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.amount.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              {...form.register('date')}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
          {form.formState.errors.date && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.date.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            {...form.register('description')}
            rows={3}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Enter expense description..."
          />
        </div>
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Receipt URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Receipt URL (Optional)
        </label>
        <input
          type="url"
          {...form.register('receipt')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          placeholder="https://example.com/receipt.pdf"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status
        </label>
        <select
          {...form.register('status')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Expense'}
        </button>
      </div>
    </form>
  );
}
