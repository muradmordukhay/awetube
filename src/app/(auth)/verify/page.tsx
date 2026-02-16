"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    token ? "loading" : "error"
  );
  const [error, setError] = useState("Invalid or expired sign-in link.");

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    async function verify() {
      const result = await signIn("email-link", {
        token,
        redirect: false,
      });

      if (!isMounted) return;

      if (result?.error) {
        setStatus("error");
        setError("Invalid or expired sign-in link.");
        return;
      }

      setStatus("success");
      router.replace("/");
      router.refresh();
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [router, token]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="w-full max-w-sm space-y-6 px-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <Video className="h-10 w-10 text-red-600" />
          <h1 className="text-2xl font-bold">Signing you in</h1>
        </div>

        {status === "loading" && (
          <p className="text-sm text-muted-foreground">
            Verifying your secure link...
          </p>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Request a new link
              </Button>
            </Link>
          </div>
        )}

        {status === "success" && (
          <p className="text-sm text-muted-foreground">
            Signed in. Redirecting...
          </p>
        )}
      </div>
    </div>
  );
}
