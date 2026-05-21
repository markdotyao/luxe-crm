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

export default async function AdminIntakeFormsPage() {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: brands }, { data: stores }] = await Promise.all([
    supabase.from("brands").select("id, name, slug").order("name"),
    supabase.from("stores").select("id, name").order("name"),
  ]);

  if (!brands?.length || !stores?.length) {
    return (
      <EmptyState
        icon={Store}
        title="No brands or stores yet"
        description="Seed at least one brand and one store before generating intake links."
      />
    );
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
        {brands.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle>{b.name}</CardTitle>
              <CardDescription>
                /customers/<code>{b.slug}</code>/<code>&lt;store-id&gt;</code>/new
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stores.map((s) => (
                <IntakeLinkRow
                  key={s.id}
                  brandSlug={b.slug}
                  storeId={s.id}
                  storeName={s.name}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
