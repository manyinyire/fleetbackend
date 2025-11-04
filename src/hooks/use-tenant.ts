'use client';

import { useAuth } from './use-auth';
import { useEffect, useState } from 'react';

interface TenantSettings {
  companyName: string;
  tenantName?: string;
  logoUrl?: string;
  primaryColor: string;
}

export function useTenant() {
  const { user } = useAuth();
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantSettings() {
      if (!(user as any)?.tenantId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/tenant/settings`);
        if (response.ok) {
          const data = await response.json();
          setTenantSettings(data);
        }
      } catch (error) {
        console.error('Error fetching tenant settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenantSettings();
  }, [user]);

  return {
    tenantSettings,
    isLoading,
    companyName: tenantSettings?.tenantName || tenantSettings?.companyName || 'Azaire Fleet Manager',
  };
}
