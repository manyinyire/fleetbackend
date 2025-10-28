import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { AdminSettingsPage } from '@/components/admin/admin-settings-page';

export default async function AdminSettingsPageRoute() {
  await requireRole('SUPER_ADMIN');

  // Fetch admin settings - placeholder since model doesn't exist yet
  const adminSettings = null;
  const ipWhitelist: any[] = [];

  const securityLogs: any[] = [];

  const settingsData = {
    adminSettings: adminSettings || {
      twoFactorEnabled: false,
      ipWhitelistEnabled: false,
      maxConcurrentSessions: 2,
      sessionTimeout: 30,
      requirePasswordChange: false,
      passwordChangeDays: 90
    },
    ipWhitelist,
    securityLogs,
    user: null
  };

  return <AdminSettingsPage data={settingsData} />;
}