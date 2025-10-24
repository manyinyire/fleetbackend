'use client';

import { useState } from 'react';

interface AssignDriverStepProps {
  vehicleId: string;
  driverId: string;
  onComplete: () => void;
}

export function AssignDriverStep({ vehicleId, driverId, onComplete }: AssignDriverStepProps) {
  const [loading, setLoading] = useState(false);

  async function handleAssign() {
    setLoading(true);
    
    try {
      const response = await fetch('/api/driver-vehicle-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          vehicleId,
          isPrimary: true,
          startDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign driver to vehicle');
      }

      onComplete();
    } catch (error) {
      console.error('Assignment error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign Driver to Vehicle</h2>
      <p className="text-gray-600 mb-8">
        Finally, let's assign the driver to the vehicle to complete your fleet setup.
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Summary</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Driver:</span> {driverId}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Vehicle:</span> {vehicleId}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Assignment Date:</span> {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Status:</span> Primary Driver
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleAssign}
          disabled={loading}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Assigning...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}