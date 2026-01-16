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
          
          // Handle response - it should be the data directly from successResponse
          if (data && typeof data === 'object') {
            // Extract company name and tenant name from response
            const companyName = data.companyName || '';
            const tenantName = data.tenantName || '';
            
            // Set tenant settings with proper values
            setTenantSettings({
              companyName: companyName || tenantName || '',
              tenantName: tenantName || companyName || '',
              logoUrl: data.logoUrl || undefined,
              primaryColor: data.primaryColor || '#1e3a8a',
            });
          }
        } else {
          // Silent fail - settings will use defaults
        }
      } catch (error) {
        // Silent fail - settings will use defaults
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenantSettings();
  }, [user]);

  // Get company name with proper fallback
  const getCompanyName = () => {
    if (!tenantSettings) return 'Fleet Manager';
    
    // Prioritize companyName, then tenantName
    const name = tenantSettings.companyName || tenantSettings.tenantName;
    
    // Ensure we have a valid name
    if (!name || name.trim().length === 0) {
      return 'Fleet Manager';
    }
    
    return name;
  };

  return {
    tenantSettings,
    isLoading,
    companyName: getCompanyName(),
  };
}
