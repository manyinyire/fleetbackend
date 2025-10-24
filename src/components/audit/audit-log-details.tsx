'use client';

import { 
  XMarkIcon, 
  UserIcon, 
  ClockIcon, 
  ComputerDesktopIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AuditLogDetailsProps {
  log: AuditLog;
  onClose: () => void;
}

export function AuditLogDetails({ log, onClose }: AuditLogDetailsProps) {
  const formatDetails = (details: any): string => {
    if (typeof details === 'string') {
      return details;
    }
    if (typeof details === 'object' && details !== null) {
      return JSON.stringify(details, null, 2);
    }
    return String(details);
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    
    // Simple user agent parsing
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Mobile')) return 'Mobile Browser';
    
    return 'Unknown Browser';
  };

  const getActionDescription = (action: string, entityType: string) => {
    const actionText = action.replace(/_/g, ' ').toLowerCase();
    const entityText = entityType.replace(/_/g, ' ').toLowerCase();
    
    switch (action) {
      case 'CREATE':
        return `A new ${entityText} was created in the system.`;
      case 'UPDATE':
        return `An existing ${entityText} was modified.`;
      case 'DELETE':
        return `A ${entityText} was permanently deleted from the system.`;
      case 'LOGIN':
        return 'User successfully authenticated and logged into the system.';
      case 'LOGOUT':
        return 'User logged out of the system.';
      case 'SMS_SENT':
        return 'An SMS notification was sent to a driver.';
      case 'EMAIL_SENT':
        return 'An email notification was sent.';
      case 'BULK_SMS_SENT':
        return 'Multiple SMS notifications were sent to drivers.';
      default:
        return `Action "${actionText}" was performed on ${entityText}.`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Audit Log Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Action Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Action Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <InformationCircleIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      <strong>Action:</strong> {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      <strong>Entity Type:</strong> {log.entityType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">
                      <strong>Entity ID:</strong> {log.entityId}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700">
                  {getActionDescription(log.action, log.entityType)}
                </p>
              </div>

              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">User Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      <strong>Name:</strong> {log.user.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">
                      <strong>Email:</strong> {log.user.email}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">
                      <strong>User ID:</strong> {log.user.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      <strong>Timestamp:</strong> {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {log.ipAddress && (
                    <div className="flex items-center">
                      <ComputerDesktopIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        <strong>IP Address:</strong> {log.ipAddress}
                      </span>
                    </div>
                  )}
                  {log.userAgent && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">
                        <strong>Browser:</strong> {parseUserAgent(log.userAgent)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              {log.details && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h4>
                  <div className="bg-white rounded border p-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                      {formatDetails(log.details)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}