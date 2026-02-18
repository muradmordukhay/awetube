import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-3.5rem)]" />}>
      <VerifyClient />
    </Suspense>
  );
}
