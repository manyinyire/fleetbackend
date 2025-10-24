'use client';

import { useState } from 'react';
import { 
  ClockIcon, 
  UserIcon, 
  DocumentTextIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { AuditLogDetails } from './audit-log-details';

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

interface AuditTrailViewerProps {
  auditLogs: AuditLog[];
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

export function AuditTrailViewer({ auditLogs, currentUser }: AuditTrailViewerProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'update':
      case 'updated':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'delete':
      case 'deleted':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'login':
      case 'logout':
        return <UserIcon className="h-4 w-4 text-purple-500" />;
      case 'sms_sent':
      case 'email_sent':
        return <DocumentTextIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return 'bg-green-100 text-green-800';
      case 'update':
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'login':
      case 'logout':
        return 'bg-purple-100 text-purple-800';
      case 'sms_sent':
      case 'email_sent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'vehicle':
        return '🚗';
      case 'driver':
        return '👤';
      case 'remittance':
        return '💰';
      case 'expense':
        return '💸';
      case 'income':
        return '📈';
      case 'user':
        return '👥';
      case 'tenant':
        return '🏢';
      default:
        return '📄';
    }
  };

  const formatActionDescription = (log: AuditLog) => {
    const action = log.action.replace(/_/g, ' ').toLowerCase();
    const entityType = log.entityType.replace(/_/g, ' ').toLowerCase();
    
    switch (log.action) {
      case 'CREATE':
        return `Created new ${entityType}`;
      case 'UPDATE':
        return `Updated ${entityType}`;
      case 'DELETE':
        return `Deleted ${entityType}`;
      case 'LOGIN':
        return 'User logged in';
      case 'LOGOUT':
        return 'User logged out';
      case 'SMS_SENT':
        return 'SMS notification sent';
      case 'EMAIL_SENT':
        return 'Email notification sent';
      case 'BULK_SMS_SENT':
        return 'Bulk SMS notifications sent';
      default:
        return `${action} ${entityType}`;
    }
  };

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedLog(null);
  };

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {auditLogs.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Audit logs will appear here as activities are performed.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <li key={log.id}>
                <div 
                  onClick={() => handleLogClick(log)}
                  className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                        <span className="text-lg">{getEntityTypeIcon(log.entityType)}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          {getActionIcon(log.action)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {formatActionDescription(log)}
                          </span>
                        </div>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>{log.user.name}</span>
                        <span className="mx-2">•</span>
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                        {log.ipAddress && (
                          <>
                            <span className="mx-2">•</span>
                            <span>IP: {log.ipAddress}</span>
                          </>
                        )}
                      </div>
                      {log.details && typeof log.details === 'object' && (
                        <div className="mt-1 text-xs text-gray-400">
                          {Object.keys(log.details).length} detail{Object.keys(log.details).length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Audit Log Details Modal */}
      {showDetails && selectedLog && (
        <AuditLogDetails
          log={selectedLog}
          onClose={handleCloseDetails}
        />
      )}
    </>
  );
}