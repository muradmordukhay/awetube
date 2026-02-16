import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const sha = process.env.GIT_SHA || "unknown";
  return NextResponse.json({
    sha,
    timestamp: new Date().toISOString(),
  });
}
