'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import InputGroup from '@/components/FormElements/InputGroup';

export default function SetupTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    companyName: '',
    phone: '+263 77 123 4567',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!data.companyName || !data.phone) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/setup-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tenant');
      }

      toast.success('Tenant created successfully!');

      // Wait a moment for the session to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to onboarding
      router.push('/onboarding');
      router.refresh();
    } catch (error: any) {
      console.error('Tenant setup error:', error);
      toast.error(error.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete Your Account Setup
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            We need a few more details to set up your fleet management account
          </p>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <InputGroup
              type="text"
              label="Company Name"
              className="mb-4 [&_input]:py-[15px]"
              placeholder="Enter your company name"
              name="companyName"
              handleChange={handleChange}
              value={data.companyName}
              required
            />

            <InputGroup
              type="tel"
              label="Phone Number"
              className="mb-5 [&_input]:py-[15px]"
              placeholder="+263 77 123 4567"
              name="phone"
              handleChange={handleChange}
              value={data.phone}
              required
            />

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                ) : (
                  'Continue to Dashboard'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
