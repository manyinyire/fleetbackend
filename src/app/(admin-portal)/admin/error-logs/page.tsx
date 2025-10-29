import { requireRole } from '@/lib/auth-helpers';
import { ErrorLogsManager } from '@/components/admin/error-logs-manager';

export default async function ErrorLogsPage() {
  await requireRole('SUPER_ADMIN');

  return <ErrorLogsManager />;
}