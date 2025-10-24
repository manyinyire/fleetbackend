'use client';

import { useState } from 'react';
import { approveRemittance, rejectRemittance } from '@/server/actions/remittances';
import { toast } from 'react-hot-toast';
import { CheckIcon, XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface RemittanceActionsProps {
  remittanceId: string;
  status: string;
  onUpdate?: () => void;
}

export function RemittanceActions({ remittanceId, status, onUpdate }: RemittanceActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading('approve');
    try {
      await approveRemittance(remittanceId);
      toast.success('Remittance approved successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve remittance');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading('reject');
    try {
      await rejectRemittance(remittanceId);
      toast.success('Remittance rejected successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject remittance');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {status === 'PENDING' && (
        <>
          <button
            onClick={handleApprove}
            disabled={loading === 'approve'}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {loading === 'approve' ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={handleReject}
            disabled={loading === 'reject'}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            {loading === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
        </>
      )}
    </div>
  );
}
