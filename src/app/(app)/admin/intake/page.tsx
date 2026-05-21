import { Store } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { IntakeLinkRow } from "./intake-link-row";

type StoreOption = { id: string; name: string };

export default async function AdminIntakeFormsPage() {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: brands }, { data: brandStores }] = await Promise.all([
    supabase.from("brands").select("id, name, slug").order("name"),
    // Pull only the pairings that exist; join the store name for display.
    supabase
      .from("brand_stores")
      .select("brand_id, stores ( id, name )")
      .order("brand_id"),
  ]);

  if (!brands?.length) {
    return (
      <EmptyState
        icon={Store}
        title="No brands yet"
        description="Seed at least one brand before generating intake links."
      />
    );
  }

  // Group stores by brand_id once.
  const storesByBrand = new Map<string, StoreOption[]>();
  for (const row of brandStores ?? []) {
    if (!row.stores) continue;
    const list = storesByBrand.get(row.brand_id) ?? [];
    list.push(row.stores);
    storesByBrand.set(row.brand_id, list);
  }
  for (const list of storesByBrand.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Intake Forms</h1>
        <p className="text-sm text-muted-foreground">
          Public customer signup links per (brand, store). Open in a new tab to
          test, or copy a full URL to share / QR.
        </p>
      </div>

      <div className="space-y-4">
        {brands.map((b) => {
          const stores = storesByBrand.get(b.id) ?? [];
          return (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle>{b.name}</CardTitle>
                <CardDescription>
                  /customers/<code>{b.slug}</code>/
                  <code>&lt;store-id&gt;</code>/new
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {stores.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No stores linked to this brand yet.
                  </p>
                ) : (
                  stores.map((s) => (
                    <IntakeLinkRow
                      key={s.id}
                      brandSlug={b.slug}
                      storeId={s.id}
                      storeName={s.name}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
