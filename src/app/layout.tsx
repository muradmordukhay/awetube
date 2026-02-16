import type { Metadata } from "next";
import "./globals.css";
import "@/lib/env";
import Providers from "@/components/layout/Providers";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "AweTube - Share Your Videos",
  description:
    "A video sharing platform where creators upload and share videos with the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
