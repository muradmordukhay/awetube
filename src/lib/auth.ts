import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { generateUniqueHandle } from "@/lib/channel-utils";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth: auto-create channel if user doesn't have one
      if (account?.provider !== "credentials" && user.id) {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).channelId = token.channelId ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).channelHandle = token.channelHandle ?? null;
      }
      return session;
    },
  },
});
