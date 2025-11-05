/**
 * Upgrade Prompt Component
 * Shows upgrade prompts for premium features
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, TrendingUp, Lock } from 'lucide-react';

export interface UpgradePromptProps {
  feature: string;
  plan: 'BASIC' | 'PREMIUM';
  description?: string;
  benefits?: string[];
  onClose?: () => void;
  variant?: 'modal' | 'banner' | 'inline';
}

export function UpgradePrompt({
  feature,
  plan,
  description,
  benefits = [],
  onClose,
  variant = 'modal',
}: UpgradePromptProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleUpgrade = () => {
    router.push('/dashboard/upgrade');
  };

  if (!isVisible) return null;

  const defaultDescription = `${feature} is a ${plan} feature. Upgrade your plan to unlock this powerful capability.`;
  const displayDescription = description || defaultDescription;

  const defaultBenefits = {
    BASIC: [
      'Up to 25 vehicles',
      'Advanced reporting',
      'Priority support',
      'API access',
      '5 user accounts',
    ],
    PREMIUM: [
      'Unlimited vehicles',
      'Custom reports & scheduling',
      '24/7 dedicated support',
      'Full API access',
      'Unlimited users',
      'White-labeling',
      'Custom integrations',
    ],
  };

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits[plan];

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">{feature}</h3>
              <p className="text-sm text-indigo-100">{displayDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Upgrade to {plan}
            </button>
            {onClose && (
              <button
                onClick={handleClose}
                className="text-white hover:text-indigo-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="border-2 border-indigo-200 bg-indigo-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-indigo-600 text-white p-3 rounded-lg">
            <Lock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {feature} - {plan} Feature
            </h3>
            <p className="text-gray-600 mb-4">{displayDescription}</p>
            <button
              onClick={handleUpgrade}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal variant (default)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {onClose && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upgrade to {plan}
          </h2>
          <p className="text-gray-600">{displayDescription}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            What you'll get:
          </h3>
          <ul className="space-y-2">
            {displayBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
          )}
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature Lock Component
 * Shows a locked feature with upgrade prompt
 */
export function FeatureLock({
  feature,
  plan,
  children,
}: {
  feature: string;
  plan: 'BASIC' | 'PREMIUM';
  children: React.ReactNode;
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <>
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setShowPrompt(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
          >
            <Lock className="w-5 h-5" />
            Unlock {feature}
          </button>
        </div>
      </div>

      {showPrompt && (
        <UpgradePrompt
          feature={feature}
          plan={plan}
          onClose={() => setShowPrompt(false)}
        />
      )}
    </>
  );
}
