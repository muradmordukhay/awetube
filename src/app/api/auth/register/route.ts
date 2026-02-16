import { NextResponse } from "next/server";
import { featureFlags } from "@/lib/feature-flags";

export async function POST() {
  if (featureFlags.authPasswordlessOnly) {
    return NextResponse.json(
      { error: "Password registration is disabled. Use email sign-in." },
      { status: 410 }
    );
  }

  return NextResponse.json(
    { error: "Password registration is not supported" },
    { status: 501 }
  );
}
