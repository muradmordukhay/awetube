/**
 * NextAuth v5 configuration.
 *
 * Strategy: JWT (not database sessions) — stateless, serverless-friendly,
 * no DB lookup per request.
 *
 * Providers: Credentials (email + bcrypt), Google OAuth, GitHub OAuth.
 *
 * Key behaviors:
 *   - OAuth users get a Channel auto-created on first sign-in
 *   - JWT token carries user.id, channelId, channelHandle
 *   - Session exposes channelId/channelHandle for client-side routing
 *
 * Type augmentations: src/types/next-auth.d.ts
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { generateUniqueHandle } from "@/lib/channel-utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
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
  events: {
    async createUser({ user }) {
      // Auto-create channel for new OAuth users
      if (user.id && user.name) {
        const handle = await generateUniqueHandle(user.name);
        await db.channel.create({
          data: {
            userId: user.id,
            handle,
            name: user.name,
            avatarUrl: user.image || null,
          },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // For returning OAuth users: ensure they have a channel.
      // New users are handled by the createUser event (runs after adapter persists the user).
      if (account?.provider !== "credentials" && user.id) {
        const dbUser = await db.user.findUnique({ where: { id: user.id } });
        if (dbUser) {
          const existingChannel = await db.channel.findUnique({
            where: { userId: user.id },
          });

          if (!existingChannel && user.name) {
            const handle = await generateUniqueHandle(user.name);
            await db.channel.create({
              data: {
                userId: user.id,
                handle,
                name: user.name,
                avatarUrl: user.image || null,
              },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.channelId = (user as Record<string, unknown>).channelId ?? null;
        token.channelHandle =
          (user as Record<string, unknown>).channelHandle ?? null;
      }

      // Refresh channel data on OAuth signIn
      if (trigger === "signIn" || trigger === "update") {
        const channel = await db.channel.findUnique({
          where: { userId: token.id as string },
          select: { id: true, handle: true },
        });
        if (channel) {
          token.channelId = channel.id;
          token.channelHandle = channel.handle;
        }
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
