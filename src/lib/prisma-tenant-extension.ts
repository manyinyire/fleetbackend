import { Prisma } from '@prisma/client';

/**
 * Prisma Client Extension for Tenant Scoping
 *
 * This extension automatically injects tenantId into all queries for tenant-scoped models.
 * It only applies to models that have a tenantId field to avoid breaking system-level queries.
 *
 * Tenant-scoped models:
 * - Vehicle, Driver, DriverVehicleAssignment
 * - Remittance, MaintenanceRecord, Contract
 * - Expense, Income, TenantSettings, AuditLog
 * - Invoice, InvoiceReminder, Payment
 *
 * Non-scoped models (excluded):
 * - Tenant, User, Session, Account, Verification
 * - PlatformSettings, AdminSettings, EmailTemplate, FeatureFlag
 * - All admin and system tables
 */
export function tenantExtension(tenantId: string) {
  // Helper to create scoping operations for a model
  const createScopedOperations = () => ({
    async findMany({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async findUnique({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async findFirst({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async create({ args, query }: any) {
      args.data = { ...args.data, tenantId };
      return query(args);
    },
    async update({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async updateMany({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async delete({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async deleteMany({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async count({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
    async aggregate({ args, query }: any) {
      args.where = { ...args.where, tenantId };
      return query(args);
    },
  });

  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'tenant-scoping',
      query: {
        // Only apply to tenant-scoped models (those with tenantId field)
        vehicle: createScopedOperations(),
        driver: createScopedOperations(),
        driverVehicleAssignment: createScopedOperations(),
        remittance: createScopedOperations(),
        maintenanceRecord: createScopedOperations(),
        contract: createScopedOperations(),
        expense: createScopedOperations(),
        income: createScopedOperations(),
        tenantSettings: createScopedOperations(),
        auditLog: createScopedOperations(),
        invoice: createScopedOperations(),
        invoiceReminder: createScopedOperations(),
        payment: createScopedOperations(),
      }
    });
  });
}