import NextAuth from "next-auth"

// Edge-compatible auth configuration (no Prisma adapter)
// Used only in middleware for session checking
const nextAuthResult = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  providers: [], // No providers needed for middleware session check
  callbacks: {
    async jwt({ token }) {
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string | null
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
  },
})

export const { auth } = nextAuthResult;
