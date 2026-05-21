"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function IntakeLinkRow({
  brandSlug,
  storeId,
  storeName,
}: {
  brandSlug: string;
  storeId: string;
  storeName: string;
}) {
  const [copied, setCopied] = useState(false);
  const path = `/customers/${brandSlug}/${storeId}/new`;

  async function copy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await navigator.clipboard.writeText(`${origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{storeName}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {path}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy URL"}
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={path} target="_blank" rel="noreferrer">
            <ExternalLink />
            Open
          </a>
        </Button>
      </div>
    </div>
  );
}
