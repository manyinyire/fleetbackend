'use client';

import { useState } from 'react';
import { 
  EnvelopeIcon, 
  DocumentTextIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  PaperAirplaneIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'welcome' | 'notification' | 'reminder' | 'alert' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: 'welcome', label: 'Welcome', color: 'blue' },
  { value: 'notification', label: 'Notification', color: 'green' },
  { value: 'reminder', label: 'Reminder', color: 'yellow' },
  { value: 'alert', label: 'Alert', color: 'red' },
  { value: 'custom', label: 'Custom', color: 'purple' }
];

// Placeholder templates for now - would be fetched from database
const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome New Driver',
    subject: 'Welcome to {{companyName}}',
    body: 'Dear {{driverName}},\n\nWelcome to {{companyName}}! We\'re excited to have you on our team.\n\nYour account has been created with the following details:\n- Phone: {{phoneNumber}}\n- Vehicle: {{vehicleInfo}}\n\nPlease log in to start managing your fleet.',
    variables: ['companyName', 'driverName', 'phoneNumber', 'vehicleInfo'],
    category: 'welcome',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Remittance Received',
    subject: 'Remittance Payment Received',
    body: 'Dear {{driverName}},\n\nWe have received your remittance of ${{amount}} for {{vehicle}} on {{date}}.\n\nThank you for your payment!',
    variables: ['driverName', 'amount', 'vehicle', 'date'],
    category: 'notification',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Maintenance Reminder',
    subject: 'Vehicle Maintenance Due: {{vehicle}}',
    body: 'Dear {{driverName}},\n\nThis is a reminder that {{vehicle}} is due for {{serviceType}}.\n\nPlease schedule maintenance soon to ensure your vehicle remains in good condition.',
    variables: ['driverName', 'vehicle', 'serviceType'],
    category: 'reminder',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
      toast.success('Template deleted');
    }
  };

  const handleToggleActive = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
    toast.success('Template status updated');
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Templates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Templates</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y">
          {templates.map(template => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                selectedTemplate?.id === template.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${getCategoryColor(template.category)}-100 text-${getCategoryColor(template.category)}-800`}
                    >
                      {categories.find(c => c.value === template.category)?.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {template.subject}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(template.id);
                    }}
                    className={`px-2 py-1 rounded text-xs ${
                      template.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {!selectedTemplate && !isCreating ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No template selected</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a template from the list to edit, or create a new one
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                  Send Test
                </button>
              </div>
            </div>

            {previewMode && selectedTemplate ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">FROM</span>
                    <span className="text-xs text-gray-400">just now</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white mb-2">
                      {selectedTemplate.subject}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedTemplate.body}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Template Name
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedTemplate?.name}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    defaultValue={selectedTemplate?.category}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedTemplate?.subject}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use {`{{variables}}`} for dynamic content
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Body
                  </label>
                  <textarea
                    rows={12}
                    defaultValue={selectedTemplate?.body}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Variables
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTemplate?.variables.map((varName) => (
                      <span
                        key={varName}
                        className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {`{{${varName}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
