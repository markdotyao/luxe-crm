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

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const sort = parseSort(sp.sort);
  const dir = parseDir(sp.dir);

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
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
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

  // Stable tiebreaker when sorting by name so multiple "Smith"s order by first name.
  if (sort === "last_name") {
    query = query.order("first_name", { ascending: dir === "asc" });
  }

  const { data, count, error } = await query;

  if (error) {
    return (
      <EmptyState
        title="Couldn't load contacts"
        description={error.message}
      />
    );
  }

  const contacts = data ?? [];
  const totalCount = count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount === 0
              ? "No contacts yet."
              : `${totalCount} contact${totalCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/contacts/new">
            <Plus />
            New contact
          </Link>
        </Button>
      </div>

      {totalCount === 0 ? (
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
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
