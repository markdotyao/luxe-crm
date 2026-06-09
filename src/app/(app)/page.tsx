import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ContactsList } from "./contacts-list";

const PAGE_SIZE = 25;

const SORT_COLUMNS = ["last_name", "phone", "email", "city", "created_at"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];

function parseSort(raw: string | undefined): SortColumn {
  return (SORT_COLUMNS as readonly string[]).includes(raw ?? "")
    ? (raw as SortColumn)
    : "created_at";
}
function parseDir(raw: string | undefined): "asc" | "desc" {
  return raw === "asc" ? "asc" : "desc";
}
function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

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

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    dir?: string;
    brand?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const sort = parseSort(sp.sort);
  const dir = parseDir(sp.dir);
  const requestedBrandSlug = sp.brand ?? null;

  const profile = await getProfile();
  if (profile && profile.role !== "admin" && !profile.brand_id) {
    return (
      <EmptyState
        icon={Users}
        title="Your account isn't assigned to a brand yet"
        description="Contact your administrator to get set up. Once you're assigned, your brand's contacts will appear here."
      />
    );
  }

  const supabase = await createClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug")
    .order("name");

  // Resolve slug → brand id. An unknown slug is treated as "no filter" so a
  // tampered URL just shows everything rather than 404'ing the list view.
  const selectedBrand = requestedBrandSlug
    ? (brands ?? []).find((b) => b.slug === requestedBrandSlug) ?? null
    : null;

  let contacts: Contact[] = [];
  let totalCount = 0;
  let loadError: string | null = null;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (selectedBrand) {
    // Filter path: two queries so we can scope contacts by brand while still
    // showing each contact's *full* set of brand badges (a contact under both
    // Panerai and Hublot should still show both badges when filtered to
    // Panerai).
    //
    // Query 1: contacts that have a contact_brands row for this brand,
    //          ordered + paginated + counted.
    // Query 2: every contact_brands row (and brand name) for those ids.
    const sortColumn = sort === "created_at" ? "created_at" : sort;
    const ascending = dir === "asc";

    const baseQuery = supabase
      .from("contacts")
      .select("id, first_name, last_name, phone, email, city, created_at, contact_brands!inner ( brand_id )", { count: "exact" })
      .eq("contact_brands.brand_id", selectedBrand.id)
      .order(sortColumn, { ascending })
      .range(from, to);

    const { data: filtered, count, error: filterError } =
      sort === "last_name"
        ? await baseQuery.order("first_name", { ascending })
        : await baseQuery;

    if (filterError) {
      loadError = filterError.message;
    } else {
      totalCount = count ?? 0;
      const ids = (filtered ?? []).map((c) => c.id);

      const { data: badges, error: badgesError } =
        ids.length === 0
          ? { data: [], error: null }
          : await supabase
              .from("contact_brands")
              .select("contact_id, brand_id, notes, brands ( id, name )")
              .in("contact_id", ids);

      if (badgesError) {
        loadError = badgesError.message;
      } else {
        const byContact = new Map<string, Contact["contact_brands"]>();
        for (const row of badges ?? []) {
          const list = byContact.get(row.contact_id) ?? [];
          list.push({
            brand_id: row.brand_id,
            notes: row.notes,
            brands: row.brands,
          });
          byContact.set(row.contact_id, list);
        }
        contacts = (filtered ?? []).map((c) => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          phone: c.phone,
          email: c.email,
          city: c.city,
          created_at: c.created_at,
          contact_brands: byContact.get(c.id) ?? [],
        }));
      }
    }
  } else {
    // No filter: single query with all brand badges joined inline.
    const baseQuery = supabase
      .from("contacts")
      .select(
        `
        id, first_name, last_name, phone, email, city, created_at,
        contact_brands ( brand_id, notes, brands ( id, name ) )
      `,
        { count: "exact" },
      )
      .order(sort, { ascending: dir === "asc" })
      .range(from, to);

    const { data, count, error } =
      sort === "last_name"
        ? await baseQuery.order("first_name", { ascending: dir === "asc" })
        : await baseQuery;

    if (error) {
      loadError = error.message;
    } else {
      contacts = data ?? [];
      totalCount = count ?? 0;
    }
  }

  if (loadError) {
    return (
      <EmptyState
        title="Couldn't load contacts"
        description={loadError}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? selectedBrand
                ? `No contacts for ${selectedBrand.name}.`
                : "No contacts yet."
              : `${totalCount} contact${totalCount === 1 ? "" : "s"}${selectedBrand ? ` · ${selectedBrand.name}` : ""}`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/contacts/new">
            <Plus />
            New contact
          </Link>
        </Button>
      </div>

      {!selectedBrand && totalCount === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to get started."
          action={
            <Button asChild size="sm">
              <Link href="/contacts/new">
                <Plus />
                New contact
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader className="sr-only">
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <ContactsList
              contacts={contacts}
              totalCount={totalCount}
              page={page}
              pageSize={PAGE_SIZE}
              sort={sort}
              dir={dir}
              brands={brands ?? []}
              brandSlug={selectedBrand?.slug ?? null}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
