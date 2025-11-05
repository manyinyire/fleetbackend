'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  SparklesIcon, 
  CheckIcon,
  ArrowUpIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

interface Plan {
  id: string;
  name: string;
  monthly: number;
}

interface PlanInfo {
  currentPlan: Plan;
  availableUpgrades: Plan[];
}

export function UpgradePageClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    fetchPlanInfo();
  }, []);

  const fetchPlanInfo = async () => {
    try {
      const response = await fetch('/api/tenant/plan');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlanInfo(data);
        }
      }
    } catch (error) {
      console.error('Error fetching plan info:', error);
      toast.error('Failed to load plan information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: Plan) => {
    setUpgrading(newPlan.id);
    try {
      const response = await fetch('/api/tenant/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPlan: newPlan.id }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text.substring(0, 200));
        toast.error('Server error: Invalid response format');
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Upgrade invoice created and sent! Check your email for invoice ${data.invoice.invoiceNumber}`);
        
        // Initiate payment
        try {
          const paymentResponse = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ invoiceId: data.invoice.id }),
          });

          // Check if payment response is JSON
          const paymentContentType = paymentResponse.headers.get('content-type');
          if (!paymentContentType || !paymentContentType.includes('application/json')) {
            const text = await paymentResponse.text();
            console.error('Payment server returned non-JSON response:', text.substring(0, 200));
            toast.error('Payment error: Invalid response format');
            return;
          }

          const paymentData = await paymentResponse.json();

          if (paymentResponse.ok && paymentData.success) {
            // Redirect to Paynow payment page
            window.location.href = paymentData.redirectUrl;
          } else {
            toast.error(paymentData.error || 'Failed to initiate payment');
          }
        } catch (error) {
          console.error('Error initiating payment:', error);
          toast.error('Failed to initiate payment');
        }
      } else {
        toast.error(data.error || 'Failed to create upgrade invoice');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Failed to process upgrade request');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!planInfo) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upgrade Plan</h1>
          <p className="mt-2 text-gray-600">Failed to load plan information</p>
        </div>
      </div>
    );
  }

  const planFeatures = {
    FREE: [
      'Up to 5 vehicles',
      'Basic reporting',
      'Email support',
      '1 user account',
    ],
    BASIC: [
      'Up to 25 vehicles',
      'Advanced reporting',
      'Priority support',
      'API access',
      '5 user accounts',
      'Custom branding',
    ],
    PREMIUM: [
      'Unlimited vehicles',
      'Custom reporting',
      '24/7 support',
      'Full API access',
      'Unlimited user accounts',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
    ],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Upgrade Your Plan</h1>
        <p className="mt-2 text-gray-600">
          Choose a plan that fits your fleet management needs
        </p>
      </div>

      {/* Current Plan Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <SparklesIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Current Plan: {planInfo.currentPlan.name}
            </h3>
            <p className="text-sm text-gray-600">
              {planInfo.currentPlan.monthly > 0 
                ? `$${planInfo.currentPlan.monthly} per month`
                : 'Free forever'}
            </p>
          </div>
        </div>
      </div>

      {/* Available Upgrades */}
      {planInfo.availableUpgrades.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckIcon className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                You&apos;re on the Premium Plan!
              </h3>
              <p className="text-sm text-gray-600">
                You have access to all features and unlimited resources.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {planInfo.availableUpgrades.map((plan) => {
            const features = planFeatures[plan.id as keyof typeof planFeatures] || [];
            const isCurrentPlan = plan.id === planInfo.currentPlan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-6 ${
                  plan.id === 'PREMIUM'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.id === 'PREMIUM' && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.monthly}
                    </span>
                    <span className="ml-2 text-gray-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={upgrading === plan.id || isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.id === 'PREMIUM'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {upgrading === plan.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpIcon className="h-5 w-5" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </button>

                {isCurrentPlan && (
                  <p className="mt-2 text-sm text-center text-gray-500">
                    This is your current plan
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CurrencyDollarIcon className="h-6 w-6 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">How Upgrades Work</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• An invoice will be generated for the upgrade amount</li>
              <li>• The invoice will be sent to your email immediately</li>
              <li>• Your plan will be upgraded automatically once payment is confirmed</li>
              <li>• You&apos;ll be charged the difference between your current and new plan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

