# OTP Implementation Status

> **⚠️ DEPRECATED:** This document is outdated. We now use BetterAuth's Email OTP plugin. See `BETTERAUTH_OTP_MIGRATION.md` for current implementation.

## ✅ **What's Implemented** (OLD - Custom Implementation)

### 1. **OTP Service** (`src/lib/otp-service.ts`)
- ✅ **6-digit OTP generation** (100000-999999)
- ✅ **10-minute expiration** for all OTPs
- ✅ **Three OTP types**:
  - `TWO_FACTOR` - For 2FA authentication
  - `PASSWORD_RESET` - For password reset flows
  - `EMAIL_VERIFICATION` - For email verification
- ✅ **OTP verification** with expiry and usage tracking
- ✅ **Automatic cleanup** of old unused OTPs
- ✅ **Email delivery** via `emailService.sendOTPEmail()`

### 2. **Database Model** (`prisma/schema.prisma`)
```prisma
model OTP {
  id        String   @id @default(cuid())
  userId    String
  code      String
  type      OTPType
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

### 3. **API Endpoints**
- ✅ `/api/auth/2fa/send-otp` - Send 2FA OTP via email
- ✅ `/api/auth/2fa/verify-otp` - Verify 2FA OTP code
- ✅ `/api/auth/2fa/enable` - Enable 2FA for user
- ✅ `/api/auth/2fa/disable` - Disable 2FA for user

### 4. **Email Templates**
- ✅ **OTP Email Template** - Beautiful HTML email with 6-digit code
- ✅ **10-minute expiry warning** in email
- ✅ **Security messaging** included

### 5. **Frontend Components**
- ✅ **TwoFactorModal** - 6-digit input with auto-focus, paste support
- ✅ **Timer display** (30 seconds countdown)
- ✅ **Error handling** and validation

---

## ⚠️ **Issues & Gaps**

### 1. **CRITICAL: Missing Import**
```typescript
// Line 147 in otp-service.ts
const secret = randomBytes(20).toString('base32');
// ❌ randomBytes is not imported!
```
**Fix needed:**
```typescript
import { randomInt, randomBytes } from 'crypto';
```

### 2. **2FA Not Integrated with Login Flow**
- ❌ **Super Admin Login** (`/api/superadmin/auth/login`):
  - Checks for 2FA requirement but doesn't verify OTP
  - Returns `requires2FA: true` but no OTP verification endpoint called
  - Frontend shows 2FA modal but verification is **simulated** (TODO comment)

- ❌ **Admin Login** (`/api/admin/auth/route.ts`):
  - Has placeholder for 2FA check: `const twoFactorEnabled = false;`
  - TOTP verification is **placeholder**: `const verified = true;`

### 3. **2FA Flow Incomplete**
```
Current Flow:
1. User logs in → Login endpoint checks 2FA enabled
2. If enabled → Returns requires2FA: true
3. Frontend shows modal → User enters code
4. ❌ Verification endpoint NOT called (simulated)
5. User redirected anyway
```

**Should be:**
```
1. User logs in → Login endpoint checks 2FA enabled
2. If enabled → Send OTP email AND return requires2FA: true
3. Frontend shows modal → User enters code
4. ✅ Call /api/auth/2fa/verify-otp with code
5. ✅ Verify OTP → Complete login if valid
```

### 4. **TOTP vs Email OTP Confusion**
- ⚠️ **Two different approaches**:
  - **Email OTP** (implemented) - 6-digit code sent via email
  - **TOTP** (mentioned but not implemented) - Time-based OTP using authenticator apps (Google Authenticator, Authy)
  
- The `TwoFactorModal` says "Enter the 6-digit code from your authenticator app" but actually expects **email OTP**
- `AdminSettings` has TOTP setup code (speakeasy) but not connected to login

### 5. **Password Reset OTP Not Used**
- ✅ `sendPasswordResetOTP()` exists
- ❌ No password reset endpoint uses it
- ❌ No password reset flow implemented

### 6. **Email Verification OTP Not Used**
- ✅ `sendEmailVerificationOTP()` exists  
- ❌ BetterAuth handles email verification differently (uses tokens, not OTP)
- ⚠️ Potential conflict between BetterAuth verification and OTP verification

---

## 📋 **OTP Service Methods**

| Method | Status | Used By |
|--------|--------|---------|
| `generateOTP()` | ✅ | Internal |
| `verifyOTP()` | ✅ | Internal |
| `sendTwoFactorOTP()` | ✅ | `/api/auth/2fa/send-otp` |
| `verifyTwoFactorOTP()` | ✅ | `/api/auth/2fa/verify-otp` |
| `sendPasswordResetOTP()` | ✅ | ❌ Not used |
| `verifyPasswordResetOTP()` | ✅ | ❌ Not used |
| `sendEmailVerificationOTP()` | ✅ | ❌ Not used |
| `verifyEmailVerificationOTP()` | ✅ | ❌ Not used |
| `enableTwoFactor()` | ✅ | `/api/auth/2fa/enable` |
| `disableTwoFactor()` | ✅ | `/api/auth/2fa/disable` |

---

## 🔧 **What Needs to Be Fixed**

### **Priority 1: Critical Bugs**
1. **Fix missing import** in `otp-service.ts`
   ```typescript
   import { randomInt, randomBytes } from 'crypto';
   ```

2. **Integrate 2FA with Super Admin login**
   - Update `/api/superadmin/auth/login` to:
     - Check if user has 2FA enabled
     - If enabled, send OTP email BEFORE returning `requires2FA: true`
     - Store temporary session/token for OTP verification
   
3. **Connect verification endpoint**
   - Update `handle2FAVerify` in `src/app/superadmin/login/page.tsx`:
     ```typescript
     const handle2FAVerify = async (code: string): Promise<boolean> => {
       const response = await fetch('/api/auth/2fa/verify-otp', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ code })
       });
       const data = await response.json();
       if (data.message) {
         router.push("/superadmin/dashboard");
         return true;
       }
       return false;
     };
     ```

### **Priority 2: Complete 2FA Flow**
1. **Add temporary session storage** for users mid-2FA
   - Store pending login state after password verification
   - Complete login after OTP verification

2. **Fix Admin login** (`/api/admin/auth/route.ts`)
   - Remove placeholder: `const twoFactorEnabled = false;`
   - Check actual user `twoFactorEnabled` field
   - Integrate OTP verification

### **Priority 3: Clarify OTP vs TOTP**
- **Option A**: Use Email OTP (current implementation)
  - Update UI text: "Enter the 6-digit code sent to your email"
  - Remove TOTP/authenticator app references
  
- **Option B**: Use TOTP (Time-based OTP)
  - Implement TOTP verification using `speakeasy` or `otplib`
  - Generate QR codes for authenticator apps
  - Update `enableTwoFactor()` to use TOTP instead of email OTP

---

## 📊 **Current 2FA Status**

| Component | Status | Notes |
|-----------|--------|-------|
| OTP Generation | ✅ | 6-digit, 10-min expiry |
| OTP Storage | ✅ | Database model exists |
| OTP Verification | ✅ | API endpoint exists |
| Email Delivery | ✅ | Template and service ready |
| Frontend UI | ✅ | Modal component ready |
| Login Integration | ❌ | Not connected |
| Password Reset | ❌ | Not implemented |
| Email Verification | ❌ | BetterAuth handles differently |

---

## 🎯 **Summary**

**OTP System: 7/10**

**Strengths:**
- ✅ Complete OTP service implementation
- ✅ Database model and storage
- ✅ Email delivery ready
- ✅ Frontend UI component ready
- ✅ API endpoints exist

**Weaknesses:**
- ❌ Not integrated with login flow
- ❌ Missing import (will crash)
- ❌ Password reset not implemented
- ❌ Email verification conflict with BetterAuth
- ❌ Confusion between Email OTP and TOTP

**Bottom Line:** The OTP infrastructure is **solid** but **not connected** to actual authentication flows. It's like having a car with all parts but the engine isn't connected to the wheels.

