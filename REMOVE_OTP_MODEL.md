# OTP Model Removal

## ✅ **Removed from Prisma Schema**

### **Removed:**
- ✅ `model OTP` - Custom OTP table
- ✅ `enum OTPType` - OTP type enum

### **Reason:**
BetterAuth's Email OTP plugin handles all OTP storage internally in its own tables. We no longer need a custom OTP model.

---

## **Database Migration Required**

### **Option 1: Drop Table Manually (Recommended)**
```sql
-- Run this in your database
DROP TABLE IF EXISTS "otps" CASCADE;
DROP TYPE IF EXISTS "OTPType";
```

### **Option 2: Use Prisma Migrate**
Since we removed the model from the schema, you can create a migration:

```bash
npx prisma migrate dev --name remove_otp_table
```

**Note:** Prisma will detect the removed model and generate a migration to drop the table.

---

## **What Happens to Existing OTPs?**

- Any OTPs in the `otps` table will be deleted when you drop the table
- This is safe because:
  - OTPs expire after 10 minutes anyway
  - BetterAuth now manages OTPs in its own tables
  - Old OTPs are no longer valid

---

## **Verification**

After migration:
- ✅ Schema validated: `npx prisma validate`
- ✅ No code references: `grep -r "prisma.otp" src/` (should return nothing)
- ✅ BetterAuth handles all OTP operations

---

## **Next Steps**

1. Run the migration to drop the table from your database
2. Generate Prisma client: `npx prisma generate`
3. Verify everything still works

**Status:** ✅ Schema updated, ready for migration

