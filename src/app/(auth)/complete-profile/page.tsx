"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && !session?.user?.needsDisplayName) {
      router.replace("/");
    }

    if (
      status === "authenticated" &&
      session?.user?.name &&
      displayName.length === 0
    ) {
      setDisplayName(session.user.name);
    }
  }, [displayName, router, session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      await update?.();
      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <Video className="h-10 w-10 text-red-600" />
          <h1 className="text-2xl font-bold">Complete your profile</h1>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Choose a display name for your channel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save and continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
