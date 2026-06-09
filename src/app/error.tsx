"use client";

import { useEffect } from "react";
import { ServiceUnavailable } from "@/components/service-unavailable";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root error boundary]", error);
  }, [error]);

  return <ServiceUnavailable onRetry={reset} showHomeLink />;
}
