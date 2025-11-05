/**
 * Tenant State Store
 *
 * Manages tenant-specific state and features
 */

import { create } from 'zustand';

interface TenantFeature {
  name: string;
  enabled: boolean;
  limit?: number;
  currentUsage?: number;
}

interface TenantState {
  // Tenant info
  tenantId: string | null;
  tenantName: string | null;
  plan: 'FREE' | 'BASIC' | 'PREMIUM' | null;

  // Features
  features: TenantFeature[];
  setFeatures: (features: TenantFeature[]) => void;
  canUseFeature: (featureName: string) => boolean;

  // Actions
  setTenant: (id: string, name: string, plan: 'FREE' | 'BASIC' | 'PREMIUM') => void;
  clearTenant: () => void;

  // Usage limits
  vehicleCount: number;
  vehicleLimit: number;
  driverCount: number;
  driverLimit: number;
  setUsageLimits: (data: {
    vehicleCount: number;
    vehicleLimit: number;
    driverCount: number;
    driverLimit: number;
  }) => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  // Initial state
  tenantId: null,
  tenantName: null,
  plan: null,
  features: [],
  vehicleCount: 0,
  vehicleLimit: 0,
  driverCount: 0,
  driverLimit: 0,

  // Feature check
  canUseFeature: (featureName: string) => {
    const feature = get().features.find((f) => f.name === featureName);
    if (!feature) return false;
    if (!feature.enabled) return false;
    if (feature.limit && feature.currentUsage !== undefined) {
      return feature.currentUsage < feature.limit;
    }
    return true;
  },

  // Set features
  setFeatures: (features) => set({ features }),

  // Set tenant
  setTenant: (id, name, plan) =>
    set({
      tenantId: id,
      tenantName: name,
      plan,
    }),

  // Clear tenant (logout)
  clearTenant: () =>
    set({
      tenantId: null,
      tenantName: null,
      plan: null,
      features: [],
      vehicleCount: 0,
      vehicleLimit: 0,
      driverCount: 0,
      driverLimit: 0,
    }),

  // Set usage limits
  setUsageLimits: (data) =>
    set({
      vehicleCount: data.vehicleCount,
      vehicleLimit: data.vehicleLimit,
      driverCount: data.driverCount,
      driverLimit: data.driverLimit,
    }),
}));
