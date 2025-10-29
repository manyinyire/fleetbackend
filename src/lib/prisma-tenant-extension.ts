import { Prisma } from '@prisma/client';

export function tenantExtension(tenantId: string) {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'tenant-scoping',
      query: {
        // Apply to all models that have tenantId
        $allModels: {
          async findMany({ args, query, model }) {
            // Auto-inject WHERE tenantId = current tenant
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async findUnique({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async create({ args, query }) {
            // Auto-populate tenantId on creation
            args.data = {
              ...args.data,
              tenantId
            } as any;
            return query(args);
          },
          async update({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async updateMany({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async delete({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async deleteMany({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async count({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          },
          async aggregate({ args, query }) {
            args.where = { 
              ...args.where, 
              tenantId 
            };
            return query(args);
          }
        }
      }
    });
  });
}