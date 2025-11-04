'use client';

import { useState, useEffect } from 'react';
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

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email-templates');
      if (!response.ok) throw new Error('Failed to load templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete template');
      }

      setTemplates(templates.filter(t => t.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      toast.success('Template deleted');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error.message || 'Failed to delete template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update template');
      }

      setTemplates(templates.map(t => 
        t.id === id ? { ...t, isActive: !t.isActive } : t
      ));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate({ ...selectedTemplate, isActive: !selectedTemplate.isActive });
      }
      toast.success('Template status updated');
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error(error.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const handleSaveTemplate = async () => {
    const form = document.querySelector('form') || document.querySelector('.space-y-4')?.parentElement;
    if (!form) {
      toast.error('Form not found');
      return;
    }

    // Get form values - we'll use a simple approach with refs or form data
    const nameInput = form.querySelector('input[type="text"]') as HTMLInputElement;
    const categorySelect = form.querySelector('select') as HTMLSelectElement;
    const subjectInput = Array.from(form.querySelectorAll('input[type="text"]'))[1] as HTMLInputElement;
    const bodyTextarea = form.querySelector('textarea') as HTMLTextAreaElement;

    if (!nameInput || !categorySelect || !subjectInput || !bodyTextarea) {
      toast.error('Please fill in all required fields');
      return;
    }

    const templateData = {
      name: nameInput.value,
      category: categorySelect.value,
      subject: subjectInput.value,
      body: bodyTextarea.value,
      variables: selectedTemplate?.variables || [],
      isActive: selectedTemplate?.isActive ?? true
    };

    try {
      setSaving(true);
      let response;

      if (isCreating) {
        // Create new template
        response = await fetch('/api/admin/email-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });
      } else if (selectedTemplate) {
        // Update existing template
        response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });
      } else {
        throw new Error('No template selected');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      toast.success(isCreating ? 'Template created' : 'Template updated');
      setIsCreating(false);
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Templates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Templates</h2>
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedTemplate(null);
            }}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Template
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new email template
            </p>
          </div>
        ) : (
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
        )}
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
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedTemplate(null);
                    }}
                    disabled={saving}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Template'}
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
