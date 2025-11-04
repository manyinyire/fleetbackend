import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { UpgradePageClient } from '@/components/upgrade/upgrade-page-client';

export default async function UpgradePage() {
  await requireTenantForDashboard();

  return <UpgradePageClient />;
}

