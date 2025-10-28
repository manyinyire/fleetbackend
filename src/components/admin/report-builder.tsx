'use client';

import { useState } from 'react';
import { 
  DocumentTextIcon, 
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon as DownloadIcon,
  EyeIcon,
  Cog6ToothIcon as CogIcon
} from '@heroicons/react/24/outline';

interface ReportColumn {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency';
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

interface ReportFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: string;
}

interface Report {
  id: string;
  name: string;
  description: string;
  entityType: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  createdBy: string;
  createdAt: string;
}

const entityTypes = [
  { value: 'drivers', label: 'Drivers', icon: '👤' },
  { value: 'vehicles', label: 'Vehicles', icon: '🚗' },
  { value: 'remittances', label: 'Remittances', icon: '💰' },
  { value: 'expenses', label: 'Expenses', icon: '💸' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { value: 'users', label: 'Users', icon: '👥' }
];

const availableColumns = {
  drivers: [
    { field: 'fullName', label: 'Full Name', type: 'text' },
    { field: 'phone', label: 'Phone', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
    { field: 'status', label: 'Status', type: 'text' },
    { field: 'createdAt', label: 'Created At', type: 'date' }
  ],
  vehicles: [
    { field: 'registrationNumber', label: 'Registration', type: 'text' },
    { field: 'make', label: 'Make', type: 'text' },
    { field: 'model', label: 'Model', type: 'text' },
    { field: 'year', label: 'Year', type: 'number' },
    { field: 'status', label: 'Status', type: 'text' }
  ],
  remittances: [
    { field: 'amount', label: 'Amount', type: 'currency' },
    { field: 'date', label: 'Date', type: 'date' },
    { field: 'status', label: 'Status', type: 'text' },
    { field: 'createdAt', label: 'Created At', type: 'date' }
  ],
  expenses: [
    { field: 'amount', label: 'Amount', type: 'currency' },
    { field: 'category', label: 'Category', type: 'text' },
    { field: 'date', label: 'Date', type: 'date' }
  ],
  maintenance: [
    { field: 'type', label: 'Type', type: 'text' },
    { field: 'cost', label: 'Cost', type: 'currency' },
    { field: 'date', label: 'Date', type: 'date' },
    { field: 'nextService', label: 'Next Service', type: 'date' }
  ],
  users: [
    { field: 'name', label: 'Name', type: 'text' },
    { field: 'email', label: 'Email', type: 'text' },
    { field: 'role', label: 'Role', type: 'text' },
    { field: 'createdAt', label: 'Created At', type: 'date' }
  ]
};

const filterOperators = [
  { value: 'eq', label: 'Equals' },
  { value: 'ne', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'in', label: 'In' }
];

const aggregationTypes = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' }
];

const mockReports: Report[] = [
  {
    id: '1',
    name: 'Driver Activity Report',
    description: 'Overview of driver activities and performance',
    entityType: 'drivers',
    columns: [
      { field: 'fullName', label: 'Full Name', type: 'text' },
      { field: 'phone', label: 'Phone', type: 'text' },
      { field: 'status', label: 'Status', type: 'text' }
    ],
    filters: [],
    createdBy: 'admin@example.com',
    createdAt: new Date().toISOString()
  }
];

export function ReportBuilder() {
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportName, setReportName] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('drivers');
  const [selectedColumns, setSelectedColumns] = useState<ReportColumn[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);

  const handleCreateReport = () => {
    const newReport: Report = {
      id: Date.now().toString(),
      name: reportName,
      description: reportDesc,
      entityType: selectedEntityType,
      columns: selectedColumns,
      filters,
      createdBy: 'admin@example.com',
      createdAt: new Date().toISOString()
    };
    setReports([...reports, newReport]);
    setIsCreating(false);
    setSelectedColumns([]);
    setFilters([]);
    setReportName('');
    setReportDesc('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Custom Reports</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Report
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y">
          {reports.map(report => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedReport?.id === report.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{report.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{report.description}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <span>{report.entityType}</span>
                    <span>•</span>
                    <span>{report.columns.length} columns</span>
                    <span>•</span>
                    <span>{report.filters.length} filters</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Generate report"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete report"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Editor */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {isCreating ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Report</h2>
              
              {/* Report Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g., Monthly Driver Report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Brief description of the report"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Entity Type
                  </label>
                  <select
                    value={selectedEntityType}
                    onChange={(e) => {
                      setSelectedEntityType(e.target.value);
                      setSelectedColumns([]);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {entityTypes.map(et => (
                      <option key={et.value} value={et.value}>{et.label}</option>
                    ))}
                  </select>
                </div>

                {/* Column Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Columns
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableColumns[selectedEntityType as keyof typeof availableColumns]?.map(col => {
                      const isSelected = selectedColumns.some(c => c.field === col.field);
                      return (
                        <label key={col.field} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedColumns(selectedColumns.filter(c => c.field !== col.field));
                              } else {
                                setSelectedColumns([...selectedColumns, { ...col, aggregate: undefined } as ReportColumn]);
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedColumns([]);
                      setReportName('');
                      setReportDesc('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateReport}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedReport ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedReport.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.description}</p>
            <div className="flex gap-2">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                <DownloadIcon className="h-4 w-4 mr-2" />
                Generate
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No report selected</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a report from the list or create a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
