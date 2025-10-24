'use client';

import { useState } from 'react';
import { unassignVehicleFromDriver } from '@/server/actions/assignments';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UnassignVehicleButtonProps {
  assignmentId: string;
  vehicleName: string;
}

export function UnassignVehicleButton({
  assignmentId,
  vehicleName,
}: UnassignVehicleButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUnassign = async () => {
    if (!confirm(`Are you sure you want to unassign ${vehicleName}?`)) {
      return;
    }

    setLoading(true);
    try {
      await unassignVehicleFromDriver(assignmentId);
      toast.success('Vehicle unassigned successfully!');
      router.refresh();
    } catch (error) {
      console.error('Unassign error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unassign vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUnassign}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-[7px] border border-red px-3 py-1 text-body-sm font-medium text-red hover:bg-red hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      title="Unassign vehicle"
    >
      <XMarkIcon className="h-4 w-4" />
      {loading ? 'Unassigning...' : 'Unassign'}
    </button>
  );
}
