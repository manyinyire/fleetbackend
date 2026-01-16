# Neon Database Migration Guide

## Overview

This guide covers migrating from your current PostgreSQL database to Neon, a serverless Postgres platform optimized for modern SaaS applications.

## Why Neon?

### Key Benefits for Fleet Management SaaS

1. **Database Branching** 🌿
   - Test schema migrations safely before production
   - Create preview environments for each PR
   - Instant database copies for development

2. **Serverless Architecture** ⚡
   - Auto-scaling based on tenant load
   - Pay only for what you use
   - Zero cold starts (unlike traditional serverless DBs)

3. **Built-in Connection Pooling** 🔄
   - Perfect for Next.js serverless functions
   - No need for external pooling services
   - Handles thousands of concurrent connections

4. **Cost Efficiency** 💰
   - Free tier: 0.5 GB storage, 191.9 compute hours/month
   - Pro tier: $19/month + usage
   - Significantly cheaper than managed PostgreSQL for multi-tenant apps

5. **Developer Experience** 🛠️
   - GitHub integration for automatic branches
   - CLI for local development
   - Web console for database management

## Migration Steps

### Phase 1: Setup Neon Account (15 minutes)

1. **Create Neon Account**
   ```bash
   # Visit https://neon.tech and sign up
   # Connect your GitHub account for seamless integration
   ```

2. **Create Main Project**
   - Project name: `fleet-management-production`
   - Region: Choose closest to your users (e.g., `aws-us-east-1`)
   - Postgres version: 16 (latest stable)

3. **Install Neon CLI**
   ```bash
   npm install -g neonctl
   neonctl auth
   ```

### Phase 2: Database Migration (30-60 minutes)

#### Option A: Migrate Existing Data (Recommended for Production)

1. **Export Current Database**
   ```bash
   # Using pg_dump
   pg_dump $DATABASE_URL > fleet_backup.sql
   
   # Or using Prisma
   npx prisma db pull
   npx prisma migrate dev --create-only --name backup_schema
   ```

2. **Get Neon Connection String**
   ```bash
   # From Neon Console > Connection Details
   # Copy the connection string (it includes pooling by default)
   ```

3. **Import to Neon**
   ```bash
   # Update .env with Neon connection string
   DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
   
   # Run Prisma migrations
   npx prisma migrate deploy
   
   # Or import SQL dump
   psql $DATABASE_URL < fleet_backup.sql
   ```

4. **Verify Data Integrity**
   ```bash
   # Check row counts
   npx prisma studio
   
   # Or use SQL
   psql $DATABASE_URL -c "SELECT 
     (SELECT COUNT(*) FROM tenants) as tenants,
     (SELECT COUNT(*) FROM vehicles) as vehicles,
     (SELECT COUNT(*) FROM drivers) as drivers,
     (SELECT COUNT(*) FROM users) as users;"
   ```

#### Option B: Fresh Start (For Development/Staging)

1. **Update Environment Variables**
   ```bash
   # .env
   DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
   ```

2. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Phase 3: Configure Connection Pooling

Neon provides two connection strings:

1. **Direct Connection** (for migrations, admin tasks)
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname
   ```

2. **Pooled Connection** (for application, serverless functions)
   ```
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
   ```

**Update your `.env`:**
```bash
# For Prisma migrations (direct connection)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# For application runtime (pooled connection)
DATABASE_URL_POOLED="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
```

**Update Prisma Client initialization:**
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.NODE_ENV === 'production' 
  ? process.env.DATABASE_URL_POOLED 
  : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;
```

### Phase 4: Enable Database Branching (Game Changer!)

1. **Install GitHub Integration**
   - Go to Neon Console > Integrations
   - Connect your GitHub repository
   - Enable automatic branch creation for PRs

2. **Configure Branch Settings**
   ```yaml
   # .github/neon.yml
   branches:
     # Create database branch for each PR
     pull_request:
       enabled: true
       parent: main
       delete_on_close: true
   ```

3. **Update CI/CD Workflow**
   ```yaml
   # .github/workflows/ci.yml
   name: CI
   on: [pull_request]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         # Neon creates branch automatically
         - name: Get Neon Branch Connection
           run: |
             echo "DATABASE_URL=${{ secrets.NEON_BRANCH_URL }}" >> $GITHUB_ENV
         
         - name: Run Migrations
           run: npx prisma migrate deploy
         
         - name: Run Tests
           run: npm test
   ```

4. **Local Development with Branches**
   ```bash
   # Create a development branch
   neonctl branches create --name dev-feature-x --parent main
   
   # Get connection string
   neonctl connection-string dev-feature-x
   
   # Update .env.local
   DATABASE_URL="<branch-connection-string>"
   
   # Work on your feature...
   
   # Delete branch when done
   neonctl branches delete dev-feature-x
   ```

### Phase 5: Optimize for Multi-Tenancy

1. **Enable Row-Level Security (RLS)**
   ```sql
   -- Neon supports all PostgreSQL features including RLS
   -- Your existing RLS policies will work as-is
   
   -- Verify RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Configure Connection Limits per Tenant**
   ```typescript
   // src/lib/get-tenant-prisma.ts
   import { PrismaClient } from '@prisma/client';
   
   const tenantPrismaClients = new Map<string, PrismaClient>();
   
   export function getTenantPrisma(tenantId: string) {
     if (!tenantPrismaClients.has(tenantId)) {
       const client = new PrismaClient({
         datasources: {
           db: {
             url: process.env.DATABASE_URL_POOLED,
           },
         },
       });
       
       tenantPrismaClients.set(tenantId, client);
     }
     
     return tenantPrismaClients.get(tenantId)!;
   }
   ```

3. **Monitor Query Performance**
   ```bash
   # Enable Neon's query insights
   # Go to Neon Console > Monitoring > Query Insights
   
   # View slow queries, connection stats, and resource usage
   ```

### Phase 6: Production Deployment

1. **Update Production Environment Variables**
   ```bash
   # On your hosting platform (Vercel, Railway, etc.)
   DATABASE_URL=<neon-pooled-connection-string>
   ```

2. **Run Final Migration**
   ```bash
   # Deploy migrations to production
   npx prisma migrate deploy
   ```

3. **Verify Production Health**
   ```bash
   # Test connection
   curl https://your-app.com/api/health
   
   # Check Neon Console for active connections
   ```

4. **Set Up Monitoring**
   - Enable Neon's built-in monitoring
   - Set up alerts for:
     - High connection count
     - Slow queries (>1s)
     - Storage usage (>80%)

## Cost Estimation

### Current PostgreSQL Costs (Estimated)
- Managed PostgreSQL: ~$50-200/month
- Connection pooling service: ~$20/month
- Backup storage: ~$10/month
- **Total: ~$80-230/month**

### Neon Costs (Projected)
- Free tier: $0/month (up to 0.5GB, 191.9 compute hours)
- Pro tier: $19/month + usage
  - Compute: ~$0.16/hour (only when active)
  - Storage: ~$0.000164/GB-hour
- **Estimated for small-medium SaaS: $19-50/month**

**Savings: 40-80% reduction in database costs**

## Rollback Plan

If you need to rollback to your previous database:

1. **Keep Old Database Running**
   - Don't delete old database for 30 days
   - Maintain backups

2. **Quick Rollback**
   ```bash
   # Revert environment variable
   DATABASE_URL=<old-database-url>
   
   # Redeploy application
   npm run build && npm run deploy
   ```

3. **Data Sync (if needed)**
   ```bash
   # Export from Neon
   pg_dump $NEON_URL > neon_backup.sql
   
   # Import to old database
   psql $OLD_DATABASE_URL < neon_backup.sql
   ```

## Advanced Features

### 1. Time Travel (Point-in-Time Recovery)
```bash
# Restore database to specific timestamp
neonctl branches create --name recovery --parent main --timestamp "2024-01-15T10:30:00Z"
```

### 2. Read Replicas
```bash
# Create read replica for analytics
neonctl branches create --name analytics-replica --parent main --read-only
```

### 3. Autoscaling Configuration
```sql
-- Configure compute autoscaling
-- Go to Neon Console > Project Settings > Compute
-- Set min/max compute units based on load
```

### 4. Database Branching Workflow
```bash
# Feature development workflow
neonctl branches create --name feature-payment-integration --parent main

# Test schema changes safely
npx prisma migrate dev

# Merge to main when ready
# Neon automatically applies migrations to main branch
```

## Troubleshooting

### Issue: Connection Timeout
```bash
# Solution: Use pooled connection string
DATABASE_URL="postgresql://...@ep-xxx-pooler.region.aws.neon.tech/..."
```

### Issue: Too Many Connections
```bash
# Solution: Configure connection limit in Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Add connection limit
  connection_limit = 10
}
```

### Issue: Slow Queries
```sql
-- Enable query logging
-- Go to Neon Console > Monitoring > Query Insights
-- Identify slow queries and add indexes

-- Example: Add index for tenant queries
CREATE INDEX CONCURRENTLY idx_vehicles_tenant_status 
ON vehicles(tenant_id, status);
```

## Performance Benchmarks

### Before (Traditional PostgreSQL)
- Cold start: ~2-5 seconds
- Query latency: ~50-200ms
- Connection overhead: ~100ms

### After (Neon)
- Cold start: ~0ms (always warm)
- Query latency: ~30-100ms (20-50% faster)
- Connection overhead: ~10ms (pooling)

## Next Steps After Migration

1. **Enable Database Branching for PRs**
2. **Set up automated backups** (Neon does this automatically)
3. **Configure monitoring alerts**
4. **Optimize queries using Neon's insights**
5. **Consider read replicas for analytics workloads**

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Neon + Prisma Guide](https://neon.tech/docs/guides/prisma)
- [Neon + Next.js Guide](https://neon.tech/docs/guides/nextjs)
- [Database Branching Guide](https://neon.tech/docs/guides/branching)
- [Neon CLI Reference](https://neon.tech/docs/reference/cli)

## Support

- Neon Discord: [discord.gg/neon](https://discord.gg/neon)
- Neon Support: support@neon.tech
- Community Forum: [community.neon.tech](https://community.neon.tech)

---

**Estimated Migration Time:**
- Setup: 15 minutes
- Data migration: 30-60 minutes
- Testing: 1-2 hours
- Production deployment: 30 minutes

**Total: 2-4 hours for complete migration**
