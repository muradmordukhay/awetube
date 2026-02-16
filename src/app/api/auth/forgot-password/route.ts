import { NextResponse } from "next/server";
import { featureFlags } from "@/lib/feature-flags";

export async function POST() {
  if (featureFlags.authPasswordlessOnly) {
    return NextResponse.json(
      { error: "Password resets are disabled. Use email sign-in." },
      { status: 410 }
    );
  }

  return NextResponse.json(
    { error: "Password resets are not supported" },
    { status: 501 }
  );
}
