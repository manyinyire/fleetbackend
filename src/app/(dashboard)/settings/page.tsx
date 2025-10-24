import { requireTenant } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { SettingsForm } from '@/components/settings/settings-form';

export default async function SettingsPage() {
  const { user, tenantId } = await requireTenant();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Customize your fleet management experience and company branding.
        </p>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  );
}