'use client';

import { useState } from 'react';
import { assignVehicleToDriver } from '@/server/actions/assignments';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { TruckIcon } from '@heroicons/react/24/outline';

interface Vehicle {
  id: string;
  registrationNumber: string;
  make: string;
  model: string;
}

interface AssignVehicleButtonProps {
  driverId: string;
  availableVehicles: Vehicle[];
  disabled?: boolean;
  activeVehicleName?: string;
}

export function AssignVehicleButton({
  driverId,
  availableVehicles,
  disabled = false,
  activeVehicleName,
}: AssignVehicleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }

    setLoading(true);
    try {
      await assignVehicleToDriver(driverId, selectedVehicle, isPrimary);
      toast.success('Vehicle assigned successfully!');
      setIsOpen(false);
      setSelectedVehicle('');
      router.refresh();
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <button
          onClick={() => !disabled && setIsOpen(true)}
          onMouseEnter={() => disabled && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          disabled={disabled}
          className={`inline-flex items-center gap-2 rounded-[7px] border border-stroke px-4.5 py-[7px] font-medium ${
            disabled
              ? 'cursor-not-allowed opacity-50 text-dark dark:text-white'
              : 'text-dark hover:bg-gray-2 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2'
          }`}
        >
          <TruckIcon className="h-5 w-5" />
          Assign Vehicle
        </button>

        {/* Tooltip */}
        {disabled && showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 w-64">
            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg">
              <p className="font-semibold mb-1">Driver Already Assigned</p>
              <p className="text-gray-300">
                This driver is currently assigned to <span className="font-semibold">{activeVehicleName}</span>.
                End the current assignment before assigning a new vehicle.
              </p>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-[10px] bg-white p-6 dark:bg-gray-dark">
            <h3 className="mb-4 text-xl font-bold text-dark dark:text-white">
              Assign Vehicle
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
                  htmlFor="vehicle"
                >
                  Select Vehicle <span className="text-red">*</span>
                </label>
                <select
                  className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-dark outline-none transition focus:border-primary active:border-primary disabled:cursor-default dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  id="vehicle"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  required
                >
                  <option value="">Select a vehicle...</option>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="h-5 w-5 rounded border-stroke text-primary focus:ring-primary dark:border-dark-3"
                />
                <label
                  htmlFor="isPrimary"
                  className="ml-3 text-body-sm font-medium text-dark dark:text-white"
                >
                  Set as primary vehicle
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedVehicle('');
                  }}
                  className="flex-1 rounded-[7px] border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-[7px] bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
