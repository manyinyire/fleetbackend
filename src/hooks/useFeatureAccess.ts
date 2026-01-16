/**
 * Feature Access Hook
 * Check if user has access to premium features
 */

'use client';

import { useState, useEffect } from 'react';
import { SubscriptionPlan } from '@prisma/client';

export interface FeatureAccessConfig {
  requiredPlan: SubscriptionPlan;
  featureName: string;
}

export const PREMIUM_FEATURES = {
  SCHEDULED_REPORTS: {
    requiredPlan: SubscriptionPlan.PREMIUM,
    featureName: 'Scheduled Reports',
  },
  WHITE_LABELING: {
    requiredPlan: SubscriptionPlan.PREMIUM,
    featureName: 'White-Labeling',
  },
  CUSTOM_INTEGRATIONS: {
    requiredPlan: SubscriptionPlan.PREMIUM,
    featureName: 'Custom Integrations',
  },
  UNLIMITED_VEHICLES: {
    requiredPlan: SubscriptionPlan.PREMIUM,
    featureName: 'Unlimited Vehicles',
  },
  API_ACCESS: {
    requiredPlan: SubscriptionPlan.BASIC,
    featureName: 'API Access',
  },
  ADVANCED_REPORTS: {
    requiredPlan: SubscriptionPlan.BASIC,
    featureName: 'Advanced Reports',
  },
  PRIORITY_SUPPORT: {
    requiredPlan: SubscriptionPlan.BASIC,
    featureName: 'Priority Support',
  },
  CUSTOM_BRANDING: {
    requiredPlan: SubscriptionPlan.BASIC,
    featureName: 'Custom Branding',
  },
} as const;

export function useFeatureAccess(feature?: keyof typeof PREMIUM_FEATURES) {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentPlan();
  }, []);

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch('/api/tenant/plan');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.plan);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (featureKey: keyof typeof PREMIUM_FEATURES): boolean => {
    if (!currentPlan) return false;

    const featureConfig = PREMIUM_FEATURES[featureKey];
    const planHierarchy = {
      [SubscriptionPlan.FREE]: 0,
      [SubscriptionPlan.BASIC]: 1,
      [SubscriptionPlan.PREMIUM]: 2,
    };

    return (
      planHierarchy[currentPlan] >= planHierarchy[featureConfig.requiredPlan]
    );
  };

  const getRequiredPlan = (
    featureKey: keyof typeof PREMIUM_FEATURES
  ): SubscriptionPlan => {
    return PREMIUM_FEATURES[featureKey].requiredPlan;
  };

  const getFeatureName = (
    featureKey: keyof typeof PREMIUM_FEATURES
  ): string => {
    return PREMIUM_FEATURES[featureKey].featureName;
  };

  const canUseFeature = feature ? hasAccess(feature) : null;

  return {
    currentPlan,
    loading,
    hasAccess,
    getRequiredPlan,
    getFeatureName,
    canUseFeature,
    isPremium: currentPlan === SubscriptionPlan.PREMIUM,
    isBasic: currentPlan === SubscriptionPlan.BASIC,
    isFree: currentPlan === SubscriptionPlan.FREE,
  };
}

/**
 * Check vehicle limit based on plan
 */
export function useVehicleLimit() {
  const { currentPlan, loading } = useFeatureAccess();

  const limits = {
    [SubscriptionPlan.FREE]: 5,
    [SubscriptionPlan.BASIC]: 25,
    [SubscriptionPlan.PREMIUM]: Infinity,
  };

  const limit = currentPlan ? limits[currentPlan] : 0;

  const canAddVehicle = async (): Promise<boolean> => {
    if (limit === Infinity) return true;

    try {
      const response = await fetch('/api/vehicles?count=true');
      if (response.ok) {
        const data = await response.json();
        return data.count < limit;
      }
    } catch (error) {
      // Silent fail
    }

    return false;
  };

  return {
    limit,
    loading,
    canAddVehicle,
    isUnlimited: limit === Infinity,
  };
}

/**
 * Check user limit based on plan
 */
export function useUserLimit() {
  const { currentPlan, loading } = useFeatureAccess();

  const limits = {
    [SubscriptionPlan.FREE]: 1,
    [SubscriptionPlan.BASIC]: 5,
    [SubscriptionPlan.PREMIUM]: Infinity,
  };

  const limit = currentPlan ? limits[currentPlan] : 0;

  const canAddUser = async (): Promise<boolean> => {
    if (limit === Infinity) return true;

    try {
      const response = await fetch('/api/users?count=true');
      if (response.ok) {
        const data = await response.json();
        return data.count < limit;
      }
    } catch (error) {
      // Silent fail
    }

    return false;
  };

  return {
    limit,
    loading,
    canAddUser,
    isUnlimited: limit === Infinity,
  };
}
