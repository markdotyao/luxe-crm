import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { NewContactForm } from "./new-contact-form";

export default async function NewContactPage() {
  const profile = await getProfile();

  if (profile && profile.role !== "admin" && !profile.brand_id) {
    return (
      <EmptyState
        icon={Users}
        title="Your account isn't assigned to a brand yet"
        description="Contact your administrator to get set up before adding contacts."
      />
    );
  }

  const supabase = await createClient();

  const [brandsResult, storesResult] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("stores").select("id, name").order("name"),
  ]);

  const brands = brandsResult.data ?? [];
  const stores = storesResult.data ?? [];

  return (
    <NewContactForm
      role={profile?.role ?? "sales_staff"}
      userBrandId={profile?.brand_id ?? null}
      userStoreId={profile?.store_id ?? null}
      brands={brands}
      stores={stores}
    />
  );
}
