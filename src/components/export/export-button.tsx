'use client';

import { useState } from 'react';
import { 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { exportData, ExportableData, ExportOptions } from '@/lib/export';
import { toast } from 'react-hot-toast';

interface ExportButtonProps {
  data: ExportableData;
  filename?: string;
  className?: string;
  showFormatOptions?: boolean;
}

export function ExportButton({ 
  data, 
  filename, 
  className = '',
  showFormatOptions = true 
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        filename: filename || `export.${format}`,
        includeHeaders: true
      };
      
      await exportData(data, options);
      toast.success(`Data exported to ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
      setShowMenu(false);
    }
  };

  const formatOptions = [
    {
      format: 'csv' as const,
      label: 'CSV',
      description: 'Comma-separated values',
      icon: TableCellsIcon,
      color: 'text-green-600'
    },
    {
      format: 'excel' as const,
      label: 'Excel',
      description: 'Microsoft Excel format',
      icon: DocumentArrowDownIcon,
      color: 'text-blue-600'
    },
    {
      format: 'pdf' as const,
      label: 'PDF',
      description: 'Portable Document Format',
      icon: DocumentTextIcon,
      color: 'text-red-600'
    }
  ];

  if (!showFormatOptions) {
    return (
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${className}`}
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${className}`}
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Icon className={`h-4 w-4 mr-3 ${option.color}`} />
                  <div className="text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}