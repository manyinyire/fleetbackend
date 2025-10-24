'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createInvoice } from '@/server/actions/invoices';
import { toast } from 'react-hot-toast';

const invoiceSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerCity: z.string().optional(),
  customerCountry: z.string().optional(),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string().min(1, 'Currency is required'),
  taxRate: z.number().min(0).max(1),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price must be greater than or equal to 0'),
  }))
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateInvoiceModal({ isOpen, onClose }: CreateInvoiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      customerCity: '',
      customerCountry: 'Zimbabwe',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'USD',
      taxRate: 0.15,
      notes: '',
      items: [
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  const watchedItems = form.watch('items');
  const watchedTaxRate = form.watch('taxRate');

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * watchedTaxRate;
  const total = subtotal + taxAmount;

  const handleSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      // Calculate item totals
      const itemsWithTotals = data.items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice
      }));

      const invoiceData = {
        id: '', // Will be generated
        invoiceNumber: '', // Will be generated
        date: data.invoiceDate,
        dueDate: data.dueDate,
        tenant: {
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: '',
        },
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
          address: data.customerAddress,
          city: data.customerCity,
          country: data.customerCountry,
        },
        items: itemsWithTotals,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        total,
        currency: data.currency,
        notes: data.notes,
      };

      await createInvoice(invoiceData);
      toast.success('Invoice created successfully!');
      onClose();
      form.reset();
    } catch (error) {
      console.error('Invoice creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Invoice</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      {...form.register('customerName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      {...form.register('customerEmail')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Phone
                    </label>
                    <input
                      {...form.register('customerPhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Country
                    </label>
                    <input
                      {...form.register('customerCountry')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Address
                    </label>
                    <input
                      {...form.register('customerAddress')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer City
                    </label>
                    <input
                      {...form.register('customerCity')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      {...form.register('invoiceDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      {...form.register('dueDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency *
                    </label>
                    <select
                      {...form.register('currency')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="USD">USD</option>
                      <option value="ZWL">ZWL</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...form.register('taxRate', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Invoice Items</h4>
                    <button
                      type="button"
                      onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <input
                            {...form.register(`items.${index}.description`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unit Price *
                          </label>
                          <div className="flex">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-4">
                          <p className="text-sm text-gray-600">
                            Total: ${(watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({(watchedTaxRate * 100).toFixed(1)}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-300 pt-2 mt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    {...form.register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}