import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { UpgradePageClient } from '@/components/upgrade/upgrade-page-client';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UpgradePage() {
  await requireTenantForDashboard();

  return <UpgradePageClient />;
}

