'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendDriverSMS, sendBulkDriverSMS } from '@/server/actions/notifications';
import { toast } from 'react-hot-toast';
import { PhoneIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const smsSchema = z.object({
  template: z.enum(['welcome', 'remittanceReceived', 'maintenanceReminder', 'paymentReminder', 'contractExpiry', 'systemAlert', 'custom']),
  customMessage: z.string().optional(),
  driverIds: z.array(z.string()).min(1, 'Select at least one driver'),
});

type SMSFormData = z.infer<typeof smsSchema>;

interface Driver {
  id: string;
  fullName: string;
  phone: string | null;
}

interface SMSNotificationPanelProps {
  drivers: Driver[];
  selectedDriverIds?: string[];
  onClose?: () => void;
}

export function SMSNotificationPanel({ drivers, selectedDriverIds = [], onClose }: SMSNotificationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>(selectedDriverIds);
  
  const form = useForm<SMSFormData>({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      template: 'systemAlert',
      customMessage: '',
      driverIds: selectedDriverIds
    }
  });

  const template = form.watch('template');

  const handleDriverToggle = (driverId: string) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleSelectAll = () => {
    const allDriverIds = drivers.filter(d => d.phone).map(d => d.id);
    setSelectedDrivers(allDriverIds);
  };

  const handleSelectNone = () => {
    setSelectedDrivers([]);
  };

  async function onSubmit(data: SMSFormData) {
    if (selectedDrivers.length === 0) {
      toast.error('Please select at least one driver');
      return;
    }

    setLoading(true);
    try {
      if (selectedDrivers.length === 1) {
        await sendDriverSMS(selectedDrivers[0], data.template, data.customMessage);
        toast.success('SMS sent successfully!');
      } else {
        const result = await sendBulkDriverSMS(selectedDrivers, data.template, data.customMessage);
        const successCount = result.results.filter(r => r.success).length;
        toast.success(`SMS sent to ${successCount} of ${result.results.length} drivers`);
      }
      
      if (onClose) onClose();
    } catch (error) {
      console.error('SMS sending error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  }

  const availableDrivers = drivers.filter(d => d.phone);
  const selectedDriverCount = selectedDrivers.length;

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Send SMS Notification</h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Send SMS notifications to your drivers
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Template
          </label>
          <select
            {...form.register('template')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="systemAlert">System Alert</option>
            <option value="welcome">Welcome Message</option>
            <option value="remittanceReceived">Remittance Received</option>
            <option value="maintenanceReminder">Maintenance Reminder</option>
            <option value="paymentReminder">Payment Reminder</option>
            <option value="contractExpiry">Contract Expiry</option>
            <option value="custom">Custom Message</option>
          </select>
        </div>

        {/* Custom Message */}
        {(template === 'custom' || template === 'systemAlert') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message
            </label>
            <textarea
              {...form.register('customMessage')}
              rows={4}
              placeholder="Enter your custom message here..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {form.formState.errors.customMessage && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.customMessage.message}
              </p>
            )}
          </div>
        )}

        {/* Driver Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Drivers ({selectedDriverCount} selected)
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-indigo-600 hover:text-indigo-500"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleSelectNone}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Select None
              </button>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {availableDrivers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <PhoneIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No drivers with phone numbers available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {availableDrivers.map((driver) => (
                  <label
                    key={driver.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDrivers.includes(driver.id)}
                      onChange={() => handleDriverToggle(driver.id)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {driver.fullName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.phone}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {template && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Message Preview</h4>
            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
              {template === 'welcome' && 'Welcome to Azaire Fleet Manager! Your driver account has been created. You can now start managing your fleet.'}
              {template === 'remittanceReceived' && 'Hi [Driver Name], your remittance of $[Amount] for [Vehicle] has been received and is being processed.'}
              {template === 'maintenanceReminder' && 'Hi [Driver Name], [Vehicle] is due for [Service Type]. Please schedule maintenance soon.'}
              {template === 'paymentReminder' && 'Hi [Driver Name], you have a payment of $[Amount] due on [Due Date]. Please make payment to avoid late fees.'}
              {template === 'contractExpiry' && 'Hi [Driver Name], your contract expires on [Expiry Date]. Please contact us to renew.'}
              {template === 'systemAlert' && (form.watch('customMessage') || 'Azaire Alert: [Your message here]')}
              {template === 'custom' && (form.watch('customMessage') || 'Your custom message here...')}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || selectedDrivers.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : `Send SMS to ${selectedDrivers.length} driver${selectedDrivers.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}