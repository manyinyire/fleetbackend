# Dependency Updates Available

This document tracks available dependency updates for the Azaire Fleet Manager project.

> **Note:** The updates below include **breaking changes** (major version updates). Review and test thoroughly before upgrading.

## Major Updates (Breaking Changes)

### Database & ORM
- **@prisma/client**: `5.22.0` → `6.18.0` (⚠️ Major)
- **prisma**: `5.22.0` → `6.18.0` (⚠️ Major)
  - Review Prisma 6 migration guide before upgrading
  - Check for breaking changes in schema syntax and query API
  - Test all database operations after upgrade

### Framework
- **next**: `15.1.6` → `16.0.1` (⚠️ Major)
  - Review Next.js 16 breaking changes
  - Check App Router compatibility
  - Test all routes and middleware

### Validation
- **zod**: `3.25.76` → `4.1.12` (⚠️ Major)
  - Review Zod 4 migration guide
  - Check schema definitions for breaking changes
  - Validate all form validations

### Logging
- **pino**: `9.14.0` → `10.1.0` (⚠️ Major)
- **pino-pretty**: `11.3.0` → `13.1.2` (⚠️ Major)
  - Check logging configuration compatibility

### UI Components
- **apexcharts**: `4.7.0` → `5.3.6` (⚠️ Major)
  - Review chart component breaking changes
  - Test all chart visualizations

### Utilities
- **tailwind-merge**: `2.6.0` → `3.3.1` (⚠️ Major)
  - Check for className merging changes

## Minor/Patch Updates (Safe)

### React
- **react**: `19.0.0` → `19.2.0`
- **react-dom**: `19.0.0` → `19.2.0`

### Authentication
- **better-auth**: `1.0.0` → `1.3.34`
  - Review changelog for new features
  - Should be backward compatible

### Icons
- **lucide-react**: `0.468.0` → `0.552.0`
  - New icons available
  - Existing icons should be compatible

### Radix UI Components (All Minor Updates)
- @radix-ui/react-alert-dialog: `1.1.2` → `1.1.15`
- @radix-ui/react-avatar: `1.1.1` → `1.1.11`
- @radix-ui/react-checkbox: `1.1.2` → `1.3.3`
- @radix-ui/react-dialog: `1.1.2` → `1.1.15`
- @radix-ui/react-dropdown-menu: `2.1.2` → `2.1.16`
- @radix-ui/react-label: `2.1.0` → `2.1.8`
- @radix-ui/react-popover: `1.1.2` → `1.1.15`
- @radix-ui/react-select: `2.1.2` → `2.2.6`
- @radix-ui/react-separator: `1.1.0` → `1.1.8`
- @radix-ui/react-slot: `1.1.0` → `1.2.4`
- @radix-ui/react-switch: `1.1.1` → `1.2.6`
- @radix-ui/react-tabs: `1.1.1` → `1.1.13`
- @radix-ui/react-toast: `1.2.2` → `1.2.15`
- @radix-ui/react-tooltip: `1.1.3` → `1.2.8`

### Other Dependencies
- **bullmq**: `5.15.0` → `5.63.0`
- **dayjs**: `1.11.13` → `1.11.19`
- **dexie**: `4.0.1` → `4.2.1`
- **ioredis**: `5.4.1` → `5.8.2`
- **jsvectormap**: `1.6.0` → `1.7.0`
- **next-themes**: `0.4.4` → `0.4.6`
- **nextjs-toploader**: `3.7.15` → `3.9.17`
- **react-apexcharts**: `1.7.0` → `1.8.0`
- **react-hook-form**: `7.53.2` → `7.66.0`
- **react-hot-toast**: `2.4.1` → `2.6.0`
- **zustand**: `5.0.2` → `5.0.8`

## Recommended Update Strategy

### Phase 1: Safe Updates (Minor/Patch)
1. Update all Radix UI components
2. Update React to 19.2.0
3. Update better-auth to 1.3.34
4. Update other minor/patch dependencies
5. Run tests and verify functionality

### Phase 2: Major Updates (One at a time)
1. **Prisma 6.x** - Update database layer first
   - Run migration tests
   - Verify all queries work
   - Check generated client types

2. **Next.js 16.x** - Update framework
   - Test all routes
   - Verify middleware
   - Check build process

3. **Zod 4.x** - Update validation
   - Review all schemas
   - Test form validations
   - Check error messages

4. **Other Major Updates** - As needed

## Update Commands

### Safe updates only:
```bash
npm update
```

### Major updates (requires manual approval):
```bash
# Update specific package
npm install <package>@latest

# Or use npm-check-updates (recommended)
npx npm-check-updates -u --target minor
npm install

# For major updates
npx npm-check-updates -u
npm install
```

## Testing Checklist

After each update phase:
- [ ] Run `npm install` successfully
- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` successfully
- [ ] Test authentication flows
- [ ] Test database operations
- [ ] Test all admin routes
- [ ] Test dashboard functionality
- [ ] Test API endpoints
- [ ] Verify UI components render correctly
- [ ] Check for console errors
- [ ] Test on different browsers

## Notes

- **Before updating:** Create a git branch for updates
- **During testing:** Check browser console for warnings
- **After updating:** Update this document with results
- **If issues arise:** Roll back and document the problem

---

*Last Updated: 2025-11-05*
*Current Node Version: Check with `node --version`*
*Current npm Version: Check with `npm --version`*
