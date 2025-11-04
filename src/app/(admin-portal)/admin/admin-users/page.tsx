import { requireRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { AdminUsersManagement } from '@/components/admin/admin-users-management';

export default async function AdminUsersPage() {
  await requireRole('SUPER_ADMIN');

  // Fetch all users with their tenant information
  const users = await prisma.user.findMany({
    include: {
      tenant: {
        select: { name: true, status: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
    tenantAdmins: users.filter(u => u.role === 'TENANT_ADMIN').length,
    regularUsers: users.filter(u => u.role && !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(u.role)).length,
  };

  return <AdminUsersManagement users={users} stats={stats} />;
}