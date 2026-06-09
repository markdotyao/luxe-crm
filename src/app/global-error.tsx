"use client";

import { useEffect } from "react";

/**
 * Last-resort fallback that runs when the *root layout* itself throws. Has
 * to render its own <html>/<body>, so we don't reuse the shadcn components.
 * Keep this minimal; component-level errors are handled by app/error.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Service temporarily unavailable
          </h1>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            We can&apos;t reach the database right now. This usually clears up
            in a few seconds.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #ccc",
              borderRadius: "0.375rem",
              cursor: "pointer",
              background: "#fff",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
