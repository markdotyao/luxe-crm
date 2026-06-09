"use client";

import { useEffect } from "react";
import { ServiceUnavailable } from "@/components/service-unavailable";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[(app) error boundary]", error);
  }, [error]);

  return <ServiceUnavailable onRetry={reset} />;
}
