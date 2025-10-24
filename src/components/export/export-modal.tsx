'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { exportData, ExportableData, ExportOptions } from '@/lib/export';
import { toast } from 'react-hot-toast';

const exportSchema = z.object({
  format: z.enum(['csv', 'excel', 'pdf']),
  filename: z.string().min(1, 'Filename is required'),
  includeHeaders: z.boolean().default(true),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional()
});

type ExportFormData = z.infer<typeof exportSchema>;

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportableData;
  defaultFilename?: string;
}

export function ExportModal({ isOpen, onClose, data, defaultFilename }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  
  const form = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      format: 'csv',
      filename: defaultFilename || 'export',
      includeHeaders: true
    }
  });

  const selectedFormat = form.watch('format');

  const handleExport = async (formData: ExportFormData) => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format: formData.format,
        filename: `${formData.filename}.${formData.format}`,
        includeHeaders: formData.includeHeaders,
        dateRange: formData.dateRange ? {
          start: new Date(formData.dateRange.start),
          end: new Date(formData.dateRange.end)
        } : undefined
      };
      
      await exportData(data, options);
      toast.success(`Data exported to ${formData.format.toUpperCase()} successfully!`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={form.handleSubmit(handleExport)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'csv', label: 'CSV', description: 'Comma-separated' },
                      { value: 'excel', label: 'Excel', description: 'Microsoft Excel' },
                      { value: 'pdf', label: 'PDF', description: 'Portable Document' }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`relative flex cursor-pointer rounded-lg p-3 border ${
                          selectedFormat === option.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...form.register('format')}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filename */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filename
                  </label>
                  <div className="flex">
                    <input
                      {...form.register('filename')}
                      className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="export"
                    />
                    <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm">
                      .{selectedFormat}
                    </span>
                  </div>
                  {form.formState.errors.filename && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.filename.message}
                    </p>
                  )}
                </div>

                {/* Options */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      {...form.register('includeHeaders')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include column headers
                    </span>
                  </label>
                </div>

                {/* Data Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Preview
                  </label>
                  <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">
                        {data.title || 'Export Data'}
                      </div>
                      <div className="text-gray-500 mb-2">
                        {data.subtitle || `${data.rows.length} rows, ${data.headers.length} columns`}
                      </div>
                      <div className="font-mono">
                        <div className="text-gray-400">
                          {data.headers.join(' | ')}
                        </div>
                        {data.rows.slice(0, 3).map((row, index) => (
                          <div key={index} className="text-gray-600">
                            {row.join(' | ')}
                          </div>
                        ))}
                        {data.rows.length > 3 && (
                          <div className="text-gray-400">
                            ... and {data.rows.length - 3} more rows
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isExporting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
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