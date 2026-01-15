'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface BillingData {
  plan: string;
  billingCycle: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  autoRenew: boolean;
  status: string;
  isInTrial: boolean;
  trialEndDate: string | null;
  paymentMethod: string | null;
}

export function BillingInfo() {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/billing/info');
      const result = await response.json();

      if (response.ok) {
        setBillingData(result);
      } else {
        toast.error('Failed to fetch billing information');
      }
    } catch (error) {
      console.error('Error fetching billing info:', error);
      toast.error('Error loading billing information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPlanDisplayName = (plan: string) => {
    const planNames: Record<string, string> = {
      'FREE': 'Free Plan',
      'BASIC': 'Basic Plan',
      'PREMIUM': 'Premium Plan',
    };
    return planNames[plan] || plan;
  };

  const getBillingCycleDisplay = (cycle: string) => {
    return cycle === 'MONTHLY' ? 'Monthly' : 'Yearly';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing Information</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing Information</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Unable to load billing information</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing Information</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Plan</label>
          <p className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
            {getPlanDisplayName(billingData.plan)}
            {billingData.isInTrial && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Trial
              </span>
            )}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Billing Cycle</label>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">
            {getBillingCycleDisplay(billingData.billingCycle)}
          </p>
        </div>

        {billingData.subscriptionEndDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {billingData.isInTrial ? 'Trial Ends' : 'Next Billing Date'}
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDate(billingData.isInTrial ? billingData.trialEndDate : billingData.subscriptionEndDate)}
            </p>
          </div>
        )}

        {billingData.subscriptionStartDate && !billingData.isInTrial && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subscription Started</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatDate(billingData.subscriptionStartDate)}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">
            {billingData.paymentMethod || 'Not configured'}
          </p>
        </div>

        {billingData.plan !== 'FREE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Auto-Renewal</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {billingData.autoRenew ? (
                <span className="inline-flex items-center text-green-600 dark:text-green-400">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Disabled
                </span>
              )}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
          <p className="mt-1 text-sm">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              billingData.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {billingData.status}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
