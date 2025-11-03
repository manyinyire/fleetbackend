import { requireTenantForDashboard } from "@/lib/auth-helpers";
import { getTenantPrisma } from "@/lib/get-tenant-prisma";
import { setTenantContext } from "@/lib/tenant";
import { AuditTrailViewer } from "@/components/audit/audit-trail-viewer";
import { AdvancedSearch } from "@/components/search/advanced-search";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stack } from "@chakra-ui/react";

export default async function AuditPage() {
  const { tenantId } = await requireTenantForDashboard();
  
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
    <Stack spacing={8}>
      <PageHeader
        title="Audit Trail"
        description="Track system activities and changes for compliance and security."
      />

      <AdvancedSearch
        onSearch={(searchData) => {
          console.log("Search data:", searchData);
        }}
        onClear={() => {
          console.log("Clear search");
        }}
        filters={filterOptions}
        placeholder="Search audit logs..."
      />

      <AuditTrailViewer auditLogs={auditLogs} />
    </Stack>
  );
}