"use client";

import { CloudOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Friendly fallback shown when the database (or any upstream request) is
 * unreachable. Used by every error.tsx boundary and the /unavailable page.
 */
export function ServiceUnavailable({
  onRetry,
  showHomeLink = false,
}: {
  onRetry?: () => void;
  showHomeLink?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader className="items-center space-y-3 text-center">
          <CloudOff className="h-10 w-10 text-muted-foreground" />
          <CardTitle>Service temporarily unavailable</CardTitle>
          <CardDescription>
            We can&apos;t reach the database right now. This usually clears up
            in a few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2">
          {onRetry ? (
            <Button onClick={onRetry} className="w-full">
              Try again
            </Button>
          ) : (
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Refresh
            </Button>
          )}
          {showHomeLink ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Back to home</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
