# BetterAuth Cookies Configuration

## ✅ **Current Cookie Configuration**

### **File:** `src/lib/auth.ts`

```typescript
advanced: {
  crossSubDomainCookies: {
    enabled: false,
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
}
```

---

## 📋 **Cookie Settings Explained**

### 1. **Cookie Prefix** ✅
- **Current:** Using default prefix `"better-auth"`
- **Format:** `${prefix}.${cookie_name}` → `better-auth.session_token`
- **Status:** ✅ **Default is fine** - No custom prefix needed

**If you want to customize:**
```typescript
advanced: {
  cookiePrefix: "azaire-fleet", // Would create: azaire-fleet.session_token
}
```

### 2. **Cross-Subdomain Cookies** ✅
- **Current:** `enabled: false`
- **Status:** ✅ **Correct** - Only enable if you need cookies across subdomains
- **Example:** If you need `auth.azaire.com` and `app.azaire.com` to share sessions

**If you need cross-subdomain (future):**
```typescript
advanced: {
  crossSubDomainCookies: {
    enabled: true,
    domain: "azaire.com", // Your root domain
  },
  trustedOrigins: [
    'https://azaire.com',
    'https://app.azaire.com',
    'https://admin.azaire.com',
  ],
}
```

⚠️ **Security Warning:** Only enable if necessary and be cautious of untrusted subdomains.

### 3. **Secure Cookies** ✅
- **Current:** `useSecureCookies: process.env.NODE_ENV === 'production'`
- **Status:** ✅ **Correct** - Secure in production, allows HTTP in development
- **Behavior:**
  - **Development:** Cookies sent over HTTP (for local testing)
  - **Production:** Cookies only sent over HTTPS (secure)

**If you want to force secure always:**
```typescript
advanced: {
  useSecureCookies: true, // Always secure, even in development
}
```

### 4. **Custom Cookie Names** ⚠️
- **Current:** Using default cookie names
- **Status:** ✅ **Default is fine** - No customization needed

**Default cookies used:**
- `better-auth.session_token` - Session token
- `better-auth.session_data` - Session data (if cookie cache enabled)
- `better-auth.dont_remember` - Remember me flag

**If you want custom cookie names:**
```typescript
advanced: {
  cookies: {
    session_token: {
      name: "azaire_session",
      attributes: {
        sameSite: "lax",
        path: "/",
      }
    },
  }
}
```

---

## 🔍 **Cookies Used by Plugins**

### **Email OTP Plugin**
- Uses BetterAuth's internal cookie management
- No custom cookies needed

### **Admin Plugin**
- Uses BetterAuth's session cookies
- Impersonation tracked via `impersonatedBy` field in session (not separate cookie)

---

## 📊 **Cookie Cache Configuration**

### **Current Settings:**
```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 1 day
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5 minutes
  },
}
```

**Cookie Cache:**
- ✅ **Enabled:** Session data cached in cookie for 5 minutes
- ✅ **Purpose:** Reduces database queries for session validation
- ✅ **Cookie:** `better-auth.session_data` stores cached session

---

## 🔒 **Security Features**

### **Cookie Attributes (Default):**
- ✅ **httpOnly:** `true` - Prevents JavaScript access (XSS protection)
- ✅ **secure:** `true` in production - HTTPS only
- ✅ **sameSite:** `lax` - CSRF protection
- ✅ **signed:** All cookies signed with `BETTER_AUTH_SECRET`

### **CSRF Protection:**
```typescript
csrf: {
  enabled: true, // ✅ Enabled
}
```

---

## ✅ **Current Configuration Status**

| Setting | Value | Status | Notes |
|---------|-------|--------|-------|
| Cookie Prefix | `better-auth` (default) | ✅ | No change needed |
| Cross-Subdomain | `disabled` | ✅ | Correct for single domain |
| Secure Cookies | Production only | ✅ | Correct for dev/prod |
| Custom Names | None | ✅ | Defaults are fine |
| Cookie Cache | Enabled (5 min) | ✅ | Good performance |
| CSRF Protection | Enabled | ✅ | Security enabled |
| httpOnly | true (default) | ✅ | XSS protection |
| Signed Cookies | Yes | ✅ | Uses BETTER_AUTH_SECRET |

---

## 💡 **Recommendations**

### **Current Setup is Optimal:**
1. ✅ **No changes needed** - Configuration follows best practices
2. ✅ **Secure by default** - Production uses HTTPS cookies
3. ✅ **Performance optimized** - Cookie cache reduces DB queries
4. ✅ **Security enabled** - CSRF protection and httpOnly cookies

### **Future Considerations:**

1. **If you add subdomains:**
   - Enable `crossSubDomainCookies` with specific domain
   - Add `trustedOrigins` for allowed subdomains

2. **If you need custom cookie names:**
   - Use `cookieOptions` to customize specific cookies
   - Keep default names unless there's a specific reason

3. **If you need longer session cache:**
   - Increase `cookieCache.maxAge` (currently 5 minutes)
   - Balance between performance and security

---

## 🎯 **Summary**

**Your cookie configuration is correct and secure!**

- ✅ Default prefix is fine
- ✅ Cross-subdomain disabled (correct for single domain)
- ✅ Secure cookies in production
- ✅ Cookie cache enabled for performance
- ✅ CSRF protection enabled
- ✅ All cookies httpOnly and signed

**No changes required** - Configuration follows BetterAuth best practices! 🎉

