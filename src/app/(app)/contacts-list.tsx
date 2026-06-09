"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ContactDetailDrawer } from "@/components/contacts/contact-detail-drawer";
import { downloadCsv, toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ContactsSearch } from "./contacts-search";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  created_at: string;
  contact_brands: {
    brand_id: string;
    notes: string | null;
    brands: { id: string; name: string } | null;
  }[];
};

type SortDir = "asc" | "desc";

type Brand = { id: string; name: string; slug: string };

type ExportRow = {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  dob: string | null;
  gender: string | null;
  city: string | null;
  created_at: string;
  brand_names: string;
};

export function ContactsList({
  contacts,
  totalCount,
  page,
  pageSize,
  sort,
  dir,
  brands,
  brandSlug,
}: {
  contacts: Contact[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort: string;
  dir: SortDir;
  brands: Brand[];
  brandSlug: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const selectedBrand = brands.find((b) => b.slug === brandSlug) ?? null;

  function navigateWith(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    router.push(`?${next.toString()}`);
  }

  function setSort(column: string) {
    const isSameColumn = sort === column;
    const nextDir: SortDir = isSameColumn
      ? dir === "asc"
        ? "desc"
        : "asc"
      : column === "created_at"
        ? "desc"
        : "asc";
    navigateWith({ sort: column, dir: nextDir, page: null });
  }

  function setPage(next: number) {
    navigateWith({ page: next === 1 ? null : String(next) });
  }

  function setBrand(next: string) {
    // Changing the filter scope invalidates the current page; reset to 1.
    navigateWith({ brand: next === "" ? null : next, page: null });
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const supabase = createClient();

      // Re-run the list query without pagination. Mirror the two-path
      // approach in (app)/page.tsx so a brand filter doesn't clip the
      // brand badges in the export.
      let exportRows: ExportRow[] = [];

      if (selectedBrand) {
        const { data: filtered, error } = await supabase
          .from("contacts")
          .select(
            "id, first_name, last_name, phone, email, dob, gender, city, created_at, contact_brands!inner ( brand_id )",
          )
          .eq("contact_brands.brand_id", selectedBrand.id)
          .order("last_name")
          .order("first_name");
        if (error) {
          toast.error(`Couldn't export: ${error.message}`);
          return;
        }
        const ids = (filtered ?? []).map((c) => c.id);
        const { data: badges, error: badgesError } =
          ids.length === 0
            ? { data: [] as Array<{ contact_id: string; brands: { name: string } | null }>, error: null }
            : await supabase
                .from("contact_brands")
                .select("contact_id, brands ( name )")
                .in("contact_id", ids);
        if (badgesError) {
          toast.error(`Couldn't export: ${badgesError.message}`);
          return;
        }
        const byContact = new Map<string, string[]>();
        for (const row of badges ?? []) {
          if (!row.brands) continue;
          const list = byContact.get(row.contact_id) ?? [];
          list.push(row.brands.name);
          byContact.set(row.contact_id, list);
        }
        exportRows = (filtered ?? []).map((c) => ({
          first_name: c.first_name,
          last_name: c.last_name,
          phone: c.phone,
          email: c.email,
          dob: c.dob,
          gender: c.gender,
          city: c.city,
          created_at: c.created_at,
          brand_names: (byContact.get(c.id) ?? []).join(", "),
        }));
      } else {
        const { data, error } = await supabase
          .from("contacts")
          .select(
            "first_name, last_name, phone, email, dob, gender, city, created_at, contact_brands ( brands ( name ) )",
          )
          .order("last_name")
          .order("first_name");
        if (error) {
          toast.error(`Couldn't export: ${error.message}`);
          return;
        }
        exportRows = (data ?? []).map((c) => ({
          first_name: c.first_name,
          last_name: c.last_name,
          phone: c.phone,
          email: c.email,
          dob: c.dob,
          gender: c.gender,
          city: c.city,
          created_at: c.created_at,
          brand_names: c.contact_brands
            .map((cb) => cb.brands?.name)
            .filter((n): n is string => !!n)
            .join(", "),
        }));
      }

      const csv = toCsv(exportRows, [
        { header: "First name", value: (r) => r.first_name },
        { header: "Last name", value: (r) => r.last_name },
        { header: "Phone", value: (r) => r.phone },
        { header: "Email", value: (r) => r.email },
        { header: "Date of birth", value: (r) => r.dob },
        {
          header: "Gender",
          value: (r) => (r.gender ? r.gender.replace(/_/g, " ") : ""),
        },
        { header: "City", value: (r) => r.city },
        { header: "Brands", value: (r) => r.brand_names },
        { header: "Created", value: (r) => r.created_at },
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const suffix = selectedBrand ? `-${selectedBrand.slug}` : "";
      downloadCsv(`contacts${suffix}-${today}.csv`, csv);
      toast.success(
        `Exported ${exportRows.length} contact${exportRows.length === 1 ? "" : "s"}`,
      );
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <ContactsSearch onSelect={setOpenId} />
        </div>
        {brands.length > 1 ? (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="brand-filter"
              className="text-xs text-muted-foreground"
            >
              Brand
            </Label>
            <SelectNative
              id="brand-filter"
              value={brandSlug ?? ""}
              onChange={(e) => setBrand(e.target.value)}
              className="w-auto"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </SelectNative>
          </div>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={exporting || totalCount === 0}
        >
          <Download />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader
                label="Name"
                column="last_name"
                currentSort={sort}
                currentDir={dir}
                onClick={() => setSort("last_name")}
              />
              <SortableHeader
                label="Phone"
                column="phone"
                currentSort={sort}
                currentDir={dir}
                onClick={() => setSort("phone")}
              />
              <SortableHeader
                label="Email"
                column="email"
                currentSort={sort}
                currentDir={dir}
                onClick={() => setSort("email")}
              />
              <SortableHeader
                label="City"
                column="city"
                currentSort={sort}
                currentDir={dir}
                onClick={() => setSort("city")}
                className="hidden md:table-cell"
              />
              <TableHead>Brands</TableHead>
              <SortableHeader
                label="Created"
                column="created_at"
                currentSort={sort}
                currentDir={dir}
                onClick={() => setSort("created_at")}
                className="hidden md:table-cell"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No contacts match this filter.
                </TableCell>
              </TableRow>
            ) : null}
            {contacts.map((c) => (
              <TableRow
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => setOpenId(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(c.id);
                  }
                }}
                className="cursor-pointer focus:bg-muted/50 focus:outline-none"
              >
                <TableCell className="font-medium">
                  {c.first_name} {c.last_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.phone ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.email ?? "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {c.city ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.contact_brands
                      .map((cb) => cb.brands)
                      .filter(
                        (b): b is { id: string; name: string } => b !== null,
                      )
                      .map((b) => (
                        <Badge key={b.id} variant="secondary">
                          {b.name}
                        </Badge>
                      ))}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {dateFormatter.format(new Date(c.created_at))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalCount > 0 ? (
        <div className="flex items-center justify-between gap-2 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {from}–{to} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ContactDetailDrawer
        contactId={openId}
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
      />
    </div>
  );
}

function SortableHeader({
  label,
  column,
  currentSort,
  currentDir,
  onClick,
  className,
}: {
  label: string;
  column: string;
  currentSort: string;
  currentDir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  const active = currentSort === column;
  const Icon = !active ? ArrowUpDown : currentDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "-ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium uppercase tracking-wide hover:bg-muted",
          active ? "text-foreground" : "text-muted-foreground",
        )}
        aria-sort={
          active ? (currentDir === "asc" ? "ascending" : "descending") : "none"
        }
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}
