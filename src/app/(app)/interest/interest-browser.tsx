"use client";

import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv, toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/client";

type BrandOption = { id: string; name: string };
type ModelOption = { id: string; reference: string; name: string | null };

type EntryRow = {
  id: string;
  notes: string | null;
  created_at: string;
  contacts: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
  } | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function InterestBrowser({
  isAdmin,
  userBrandId,
  brands,
}: {
  isAdmin: boolean;
  userBrandId: string | null;
  brands: BrandOption[];
}) {
  const [brandId, setBrandId] = useState<string>(
    isAdmin ? "" : (userBrandId ?? ""),
  );
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelId, setModelId] = useState<string>("");

  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  // Load models when brand changes.
  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId("");
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("models")
      .select("id, reference, name")
      .eq("brand_id", brandId)
      .order("reference")
      .then(({ data }) => {
        if (cancelled) return;
        setModels(data ?? []);
        setModelId("");
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // Load entries when model changes.
  useEffect(() => {
    if (!modelId) {
      setEntries([]);
      setEntriesError(null);
      return;
    }
    let cancelled = false;
    setLoadingEntries(true);
    setEntriesError(null);
    const supabase = createClient();
    supabase
      .from("interest_entries")
      .select(
        `
        id, notes, created_at,
        contacts ( id, first_name, last_name, phone, email ),
        profiles ( first_name, last_name )
      `,
      )
      .eq("model_id", modelId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoadingEntries(false);
        if (error) {
          setEntriesError(error.message);
          setEntries([]);
          return;
        }
        setEntries(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const selectedModel = models.find((m) => m.id === modelId);
  const selectedBrandName = brands.find((b) => b.id === brandId)?.name ?? null;

  function exportCsv() {
    if (entries.length === 0 || !selectedModel) return;
    const csv = toCsv(entries, [
      {
        header: "First name",
        value: (e) => e.contacts?.first_name ?? "",
      },
      {
        header: "Last name",
        value: (e) => e.contacts?.last_name ?? "",
      },
      { header: "Phone", value: (e) => e.contacts?.phone ?? "" },
      { header: "Email", value: (e) => e.contacts?.email ?? "" },
      { header: "Notes", value: (e) => e.notes ?? "" },
      { header: "Added at", value: (e) => e.created_at },
      {
        header: "Added by",
        value: (e) =>
          e.profiles
            ? `${e.profiles.first_name ?? ""} ${e.profiles.last_name ?? ""}`.trim()
            : "",
      },
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const safeBrand = (selectedBrandName ?? "brand")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const safeRef = selectedModel.reference
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    downloadCsv(`interest-${safeBrand}-${safeRef}-${today}.csv`, csv);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Interest List
          </h1>
          <p className="text-sm text-muted-foreground">
            Track customer waitlists for specific model references.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/interest/new">
            <Plus />
            Create Entry
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Browse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand-filter">Brand</Label>
              <SelectNative
                id="brand-filter"
                disabled={!isAdmin && brands.length <= 1}
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                {isAdmin ? <option value="">Select brand…</option> : null}
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </SelectNative>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-filter">Model</Label>
              <SelectNative
                id="model-filter"
                disabled={!brandId || models.length === 0}
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
              >
                <option value="">
                  {brandId
                    ? models.length === 0
                      ? "No models for this brand"
                      : "Select model…"
                    : "Select a brand first"}
                </option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {modelLabel(m)}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>
        </CardContent>
      </Card>

      {modelId ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {selectedModel ? modelLabel(selectedModel) : "Selected model"}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {entries.length === 0
                  ? loadingEntries
                    ? "Loading…"
                    : "No customers yet"
                  : `${entries.length} customer${entries.length === 1 ? "" : "s"}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                disabled={entries.length === 0 || loadingEntries}
              >
                <Download />
                Export CSV
              </Button>
            </div>
          </div>

          {entriesError ? (
            <p className="text-sm text-destructive">{entriesError}</p>
          ) : entries.length === 0 ? null : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Added
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">
                          {e.contacts ? (
                            <Link
                              href={`/contacts/${e.contacts.id}`}
                              className="hover:underline"
                            >
                              {e.contacts.first_name} {e.contacts.last_name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {e.contacts?.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {e.contacts?.email ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-xs whitespace-pre-wrap text-sm">
                          {e.notes ?? "—"}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                          {dateFormatter.format(new Date(e.created_at))}
                          {e.profiles
                            ? ` · ${e.profiles.first_name ?? ""} ${e.profiles.last_name ?? ""}`.trim()
                            : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}
    </div>
  );
}

function modelLabel(m: ModelOption) {
  return m.name ? `${m.reference} — ${m.name}` : m.reference;
}
