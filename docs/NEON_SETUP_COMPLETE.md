# Neon Database Setup - Quick Start

## ✅ Your Neon Database is Ready!

**Project:** `ep-empty-butterfly-ah39ycds`  
**Region:** US East 1 (AWS)  
**Database:** `neondb`

## 🚀 Next Steps to Complete Migration

### Step 1: Update Your `.env` File

Replace your current `DATABASE_URL` with the Neon connection string:

```bash
# For development/production runtime (pooled connection)
DATABASE_URL="postgresql://neondb_owner:npg_v2AN7gVOZbak@ep-empty-butterfly-ah39ycds-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# For Prisma migrations (direct connection)
DATABASE_URL_DIRECT="postgresql://neondb_owner:npg_v2AN7gVOZbak@ep-empty-butterfly-ah39ycds.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Important:** The pooled connection (`-pooler`) is optimized for serverless Next.js functions.

### Step 2: Test the Connection

```bash
# Test connection
npx prisma db pull

# Should output: "Introspecting based on datasource defined in prisma/schema.prisma"
```

### Step 3: Run Migrations

```bash
# Deploy your existing schema to Neon
npx prisma migrate deploy

# Or if starting fresh
npx prisma db push
```

### Step 4: Seed the Database (Optional)

```bash
# Seed with initial data
npm run db:seed
```

### Step 5: Verify in Prisma Studio

```bash
# Open Prisma Studio to view your data
npm run db:studio
```

## 🔄 Connection Types Explained

### Pooled Connection (Runtime)
```
ep-empty-butterfly-ah39ycds-pooler.c-3.us-east-1.aws.neon.tech
```
- ✅ Use in your Next.js app
- ✅ Handles thousands of serverless connections
- ✅ Automatic connection pooling
- ✅ Lower latency

### Direct Connection (Migrations)
```
ep-empty-butterfly-ah39ycds.c-3.us-east-1.aws.neon.tech
```
- ✅ Use for Prisma migrations
- ✅ Use for Prisma Studio
- ✅ Use for database admin tasks
- ✅ Direct database access

## 📝 Update Prisma Configuration

You can optionally configure Prisma to use different connections:

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT") // For migrations
}
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Rotate credentials** - If accidentally exposed
3. **Use environment variables** - In production (Vercel, Railway, etc.)
4. **Enable IP allowlist** - In Neon Console (optional)

## 🎯 Production Deployment

When deploying to production:

```bash
# Set environment variables on your hosting platform
DATABASE_URL="postgresql://neondb_owner:npg_v2AN7gVOZbak@ep-empty-butterfly-ah39ycds-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Deploy
npm run build
npm run deploy
```

## 🌿 Enable Database Branching (Optional)

Create development branches for safe testing:

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# Create a dev branch
neonctl branches create --name dev --parent main

# Get branch connection string
neonctl connection-string dev
```

## 📊 Monitor Your Database

Access Neon Console: https://console.neon.tech

- **Monitoring** - View query performance, connections, storage
- **Branches** - Manage database branches
- **Settings** - Configure autoscaling, backups
- **Query Insights** - Identify slow queries

## 🆘 Troubleshooting

### Issue: "Connection timeout"
```bash
# Solution: Ensure you're using the pooled connection
# Check that -pooler is in the hostname
```

### Issue: "SSL required"
```bash
# Solution: Add sslmode=require to connection string
DATABASE_URL="...?sslmode=require"
```

### Issue: "Too many connections"
```bash
# Solution: You're using direct connection instead of pooled
# Switch to the -pooler hostname
```

### Issue: "Migration failed"
```bash
# Solution: Use direct connection for migrations
DATABASE_URL_DIRECT="postgresql://...@ep-empty-butterfly-ah39ycds.c-3..."
npx prisma migrate deploy
```

## ✨ What You Get with Neon

- ✅ **Instant database provisioning** - No waiting
- ✅ **Autoscaling** - Scales with your traffic
- ✅ **Database branching** - Test changes safely
- ✅ **Point-in-time recovery** - Restore to any moment
- ✅ **Built-in connection pooling** - No external service needed
- ✅ **Generous free tier** - 0.5 GB storage, 191.9 compute hours/month

## 📈 Cost Optimization

Your current setup:
- **Free tier** - Covers development and small production workloads
- **Compute** - Only charged when database is active
- **Storage** - Pay for what you use

Estimated costs:
- Development: **$0/month** (within free tier)
- Small production (<10 tenants): **$0-19/month**
- Medium production (10-100 tenants): **$19-50/month**

## 🔗 Quick Links

- [Neon Console](https://console.neon.tech)
- [Neon Documentation](https://neon.tech/docs)
- [Prisma + Neon Guide](https://neon.tech/docs/guides/prisma)
- [Database Branching](https://neon.tech/docs/guides/branching)

---

**Need Help?**
- Check `docs/NEON_MIGRATION_GUIDE.md` for detailed migration steps
- Visit Neon Discord: [discord.gg/neon](https://discord.gg/neon)
- Contact support: support@neon.tech
