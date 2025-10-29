import { requireRole } from '@/lib/auth-helpers';
import { PerformanceMonitor } from '@/components/admin/performance-monitor';

export default async function PerformancePage() {
  await requireRole('SUPER_ADMIN');

  return <PerformanceMonitor />;
}