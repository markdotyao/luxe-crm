import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { InterestBrowser } from "./interest-browser";

export default async function InterestListPage() {
  const profile = await getProfile();

  if (profile && profile.role !== "admin" && !profile.brand_id) {
    return (
      <EmptyState
        icon={Users}
        title="Your account isn't assigned to a brand yet"
        description="Contact your administrator to get set up before viewing the interest list."
      />
    );
  }

  const supabase = await createClient();
  const isAdmin = profile?.role === "admin";

  // Admin sees all brands; non-admin sees only their own.
  const brandsQuery = isAdmin
    ? supabase.from("brands").select("id, name").order("name")
    : supabase
        .from("brands")
        .select("id, name")
        .eq("id", profile?.brand_id ?? "")
        .order("name");

  const { data: brands } = await brandsQuery;

  return (
    <InterestBrowser
      isAdmin={isAdmin}
      userBrandId={profile?.brand_id ?? null}
      brands={brands ?? []}
    />
  );
}
