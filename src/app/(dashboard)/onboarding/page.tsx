'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddVehicleStep } from '@/components/onboarding/add-vehicle-step';
import { AddDriverStep } from '@/components/onboarding/add-driver-step';
import { AssignDriverStep } from '@/components/onboarding/assign-driver-step';

function Step({ number, active, completed, label }: { number: number; active: boolean; completed: boolean; label: string }) {
  return (
    <div className="flex items-center">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
        completed 
          ? 'bg-green-500 text-white' 
          : active 
            ? 'bg-indigo-500 text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>
        {completed ? '✓' : number}
      </div>
      <span className={`ml-2 text-sm font-medium ${
        active || completed ? 'text-indigo-600' : 'text-gray-500'
      }`}>
        {label}
      </span>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

  async function completeOnboarding() {
    try {
      const response = await fetch('/api/onboarding/complete', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding completion error:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <Step number={1} active={step >= 1} completed={step > 1} label="Add Vehicle" />
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <Step number={2} active={step >= 2} completed={step > 2} label="Add Driver" />
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <Step number={3} active={step >= 3} completed={step > 3} label="Assign Driver" />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow p-8">
          {step === 1 && (
            <AddVehicleStep
              onComplete={(id) => {
                setVehicleId(id);
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <AddDriverStep
              onComplete={(id) => {
                setDriverId(id);
                setStep(3);
              }}
            />
          )}

          {step === 3 && vehicleId && driverId && (
            <AssignDriverStep
              vehicleId={vehicleId}
              driverId={driverId}
              onComplete={completeOnboarding}
            />
          )}
        </div>
      </div>
    </div>
  );
}