import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      tenantId: string | null
      emailVerified: Date | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    tenantId?: string | null
    emailVerified?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    tenantId: string | null
    emailVerified: Date | null
  }
}
