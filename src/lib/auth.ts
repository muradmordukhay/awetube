/**
 * NextAuth v5 configuration.
 *
 * Strategy: JWT (not database sessions) — stateless, serverless-friendly,
 * no DB lookup per request.
 *
 * Provider: Credentials (email + bcrypt).
 *
 * Key behaviors:
 *   - JWT token carries user.id, channelId, channelHandle
 *   - Session exposes channelId/channelHandle for client-side routing
 *
 * Type augmentations: src/types/next-auth.d.ts
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
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
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: { channel: true },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          channelId: user.channel?.id ?? null,
          channelHandle: user.channel?.handle ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.channelId = (user as Record<string, unknown>).channelId ?? null;
        token.channelHandle =
          (user as Record<string, unknown>).channelHandle ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.channelId = (token.channelId as string | null) ?? null;
        session.user.channelHandle =
          (token.channelHandle as string | null) ?? null;
      }
      return session;
    },
  },
});
