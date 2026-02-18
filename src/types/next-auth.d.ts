import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      channelId: string | null;
      channelHandle: string | null;
      needsDisplayName: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    channelId?: string | null;
    channelHandle?: string | null;
    needsDisplayName?: boolean | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    channelId: string | null;
    channelHandle: string | null;
    needsDisplayName: boolean;
  }
}
