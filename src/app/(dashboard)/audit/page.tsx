import { requireTenantForDashboard } from '@/lib/auth-helpers';
import { getTenantPrisma } from '@/lib/get-tenant-prisma';
import { setTenantContext } from '@/lib/tenant';
import { AuditTrailViewer } from '@/components/audit/audit-trail-viewer';
import { AdvancedSearch } from '@/components/search/advanced-search';
import { useState } from 'react';

export default async function AuditPage() {
  const { user, tenantId } = await requireTenantForDashboard();
  
  // Set RLS context
  await setTenantContext(tenantId);
  
  // Get scoped Prisma client
  const prisma = getTenantPrisma(tenantId);

  // Fetch audit logs with user information
  const auditLogs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    where: {
      tenantId: tenantId
    }
  });

  // Get unique actions for filter options
  const uniqueActions = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
    where: {
      tenantId: tenantId
    }
  });

  const uniqueEntityTypes = await prisma.auditLog.findMany({
    select: { entityType: true },
    distinct: ['entityType'],
    orderBy: { entityType: 'asc' },
    where: {
      tenantId: tenantId
    }
  });

  const filterOptions = [
    {
      key: 'action',
      label: 'Action',
      type: 'select' as const,
      options: uniqueActions.map((a: any) => ({ value: a.action, label: a.action.replace('_', ' ') }))
    },
    {
      key: 'entityType',
      label: 'Entity Type',
      type: 'select' as const,
      options: uniqueEntityTypes.map((e: any) => ({ value: e.entityType, label: e.entityType.replace('_', ' ') }))
    },
    {
      key: 'userId',
      label: 'User',
      type: 'text' as const,
      placeholder: 'Search by user name or email'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
        <p className="mt-2 text-gray-600">
          Track all system activities and changes for compliance and security.
        </p>
      </div>

      <AdvancedSearch
        onSearch={(searchData) => {
          // TODO: Implement client-side filtering or server-side search
        }}
        onClear={() => {
          // TODO: Implement clear search
        }}
        filters={filterOptions}
        placeholder="Search audit logs..."
      />

      <AuditTrailViewer 
        auditLogs={auditLogs}
        currentUser={user}
      />
    </div>
  );
}