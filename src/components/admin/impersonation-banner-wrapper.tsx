"use client";

import { useEffect, useState } from 'react';
import { ImpersonationBanner } from '@/components/admin/impersonation';

export function ImpersonationBannerWrapper() {
  const [impersonationData, setImpersonationData] = useState<{
    tenantId: string;
    tenantName: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    // Check URL parameters for impersonation
    const urlParams = new URLSearchParams(window.location.search);
    const impersonateTenantId = urlParams.get('impersonate');
    const reason = urlParams.get('reason');

    if (impersonateTenantId) {
      // In a real implementation, you'd fetch the tenant name from an API
      setImpersonationData({
        tenantId: impersonateTenantId,
        tenantName: `Tenant ${impersonateTenantId.slice(0, 8)}...`,
        reason: reason || 'No reason provided'
      });
    }
  }, []);

  const handleStopImpersonation = () => {
    // Remove impersonation parameters from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('impersonate');
    url.searchParams.delete('reason');
    window.history.replaceState({}, '', url.toString());
    
    setImpersonationData(null);
  };

  if (!impersonationData) return null;

  return (
    <ImpersonationBanner
      tenantName={impersonationData.tenantName}
      onStop={handleStopImpersonation}
    />
  );
}
