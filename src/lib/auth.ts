/**
 * NextAuth v5 configuration.
 *
 * Strategy: JWT (not database sessions) — stateless, serverless-friendly,
 * no DB lookup per request.
 *
 * Provider: Credentials (email link token).
 *
 * Key behaviors:
 *   - JWT token carries user.id, channelId, channelHandle
 *   - Session exposes channelId/channelHandle for client-side routing
 *
 * Type augmentations: src/types/next-auth.d.ts
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { authLimiter, getClientIp } from "@/lib/rate-limit";
import { featureFlags } from "@/lib/feature-flags";
import { deriveDisplayName, normalizeEmail } from "@/lib/auth-utils";
import { generateUniqueHandle } from "@/lib/channel-utils";

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
      id: "email-link",
      name: "email-link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials, request) {
        if (!featureFlags.authEmailLinks) return null;

        const token = credentials?.token;
        if (!token) return null;

        if (featureFlags.authRateLimit && request) {
          const ip = getClientIp(request);
          const limit = await authLimiter.check(ip);
          if (!limit.success) return null;
        }

        const tokenHash = createHash("sha256").update(token).digest("hex");
        const now = new Date();

        const user = await db.$transaction(async (tx) => {
          const loginToken = await tx.loginToken.findUnique({
            where: { tokenHash },
          });

          if (
            !loginToken ||
            loginToken.usedAt ||
            loginToken.expiresAt < now
          ) {
            return null;
          }

          const updated = await tx.loginToken.updateMany({
            where: { id: loginToken.id, usedAt: null },
            data: { usedAt: now },
          });

          if (updated.count === 0) return null;

          const email = normalizeEmail(loginToken.email);
          let dbUser = await tx.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            include: { channel: true },
          });

          if (!dbUser) {
            const displayName = deriveDisplayName(email);
            const handle = await generateUniqueHandle(displayName);
            dbUser = await tx.user.create({
              data: {
                email,
                name: displayName,
                needsDisplayName: true,
                channel: {
                  create: {
                    handle,
                    name: displayName,
                  },
                },
              },
              include: { channel: true },
            });
          }

          return dbUser;
        });

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          channelId: user.channel?.id ?? null,
          channelHandle: user.channel?.handle ?? null,
          needsDisplayName: featureFlags.profileCompletion
            ? user.needsDisplayName
            : false,
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
        token.needsDisplayName =
          (user as Record<string, unknown>).needsDisplayName ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.channelId = (token.channelId as string | null) ?? null;
        session.user.channelHandle =
          (token.channelHandle as string | null) ?? null;
        session.user.needsDisplayName =
          (token.needsDisplayName as boolean | null) ?? false;
      }
      return session;
    },
  },
});
