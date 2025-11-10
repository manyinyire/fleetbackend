import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true },
        })

        if (!user || !user.password) {
          throw new Error("No account found with this email address. Please check your email or sign up.")
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) {
          throw new Error("Incorrect password. Please try again or use 'Forgot Password' to reset it.")
        }

        // Check if user is banned
        if (user.banned) {
          throw new Error(user.banReason || "Your account has been banned. Please contact support for more information.")
        }

        // Check tenant status
        if (user.tenantId && user.tenant) {
          if (user.tenant.status === "SUSPENDED") {
            throw new Error("Your account has been suspended. Please contact support to resolve this issue.")
          }
          if (user.tenant.status === "CANCELED") {
            throw new Error("Your account has been cancelled. Please contact support to reactivate.")
          }
        }

        // Check if user has tenantId (except for SUPER_ADMIN)
        if (user.role !== "SUPER_ADMIN" && !user.tenantId) {
          throw new Error("Account setup incomplete. Please contact support for assistance.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || "user",
          tenantId: user.tenantId,
          emailVerified: user.emailVerified ? new Date() : null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.emailVerified = user.emailVerified
      }

      // Update token on session update
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

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
  events: {
    async signIn({ user }) {
      // Update last login
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
})
