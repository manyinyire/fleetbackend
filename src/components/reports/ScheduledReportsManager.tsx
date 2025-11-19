/**
 * Scheduled Reports Manager Component
 * Manage scheduled reports (PREMIUM feature)
 */

'use client';

import { useState, useEffect } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Trash2,
  Edit,
  Play,
  AlertCircle,
} from 'lucide-react';

interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  reportType: string;
  frequency: string;
  format: string[];
  recipients: string[];
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
}

export function ScheduledReportsManager() {
  const { hasAccess, getRequiredPlan } = useFeatureAccess();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canAccess = hasAccess('SCHEDULED_REPORTS');

  useEffect(() => {
    if (canAccess) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [canAccess]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/scheduled-reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async (reportId: string) => {
    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}/trigger`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Report generation triggered successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to trigger report');
      }
    } catch (error) {
      alert('Failed to trigger report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduled-reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchReports();
      } else {
        alert('Failed to delete report');
      }
    } catch (error) {
      alert('Failed to delete report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="p-6">
        <UpgradePrompt
          feature="Scheduled Reports"
          plan={getRequiredPlan('SCHEDULED_REPORTS') as 'BASIC' | 'PREMIUM'}
          variant="inline"
          description="Automate your reporting with scheduled reports delivered directly to your inbox."
          benefits={[
            'Daily, weekly, monthly, or quarterly schedules',
            'Multiple report formats (PDF, CSV, Excel)',
            'Email delivery to multiple recipients',
            'Custom filters and date ranges',
            'Automated generation and delivery',
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Scheduled Reports
            </h2>
            <p className="text-gray-600">
              Automate report generation and delivery
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Report
          </button>
        </div>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No scheduled reports yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first scheduled report to automate your reporting workflow
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            Create Report
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {report.name}
                  </h3>
                  {report.description && (
                    <p className="text-sm text-gray-600">{report.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      report.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {report.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Report Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {report.reportType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Frequency</p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {report.frequency}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Formats</p>
                  <p className="text-sm font-medium text-gray-900">
                    {report.format.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recipients</p>
                  <p className="text-sm font-medium text-gray-900">
                    {report.recipients.length} recipient(s)
                  </p>
                </div>
              </div>

              {report.nextRunAt && (
                <div className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Next run:{' '}
                  {new Date(report.nextRunAt).toLocaleString()}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleTrigger(report.id)}
                  className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
                >
                  <Play className="w-4 h-4" />
                  Run Now
                </button>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
