import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { InterestEntryForm } from "./interest-entry-form";

export default async function NewInterestEntryPage() {
  const profile = await getProfile();

  if (profile && profile.role !== "admin" && !profile.brand_id) {
    return (
      <EmptyState
        icon={Users}
        title="Your account isn't assigned to a brand yet"
        description="Contact your administrator to get set up before creating interest entries."
      />
    );
  }

  const supabase = await createClient();
  const isAdmin = profile?.role === "admin";

  const brandsQuery = isAdmin
    ? supabase.from("brands").select("id, name").order("name")
    : supabase
        .from("brands")
        .select("id, name")
        .eq("id", profile?.brand_id ?? "")
        .order("name");

  const [{ data: brands }, { data: contacts }] = await Promise.all([
    brandsQuery,
    // RLS scopes contacts to the user's brand (admin sees all).
    supabase
      .from("contacts")
      .select("id, first_name, last_name, dob, gender, phone, email, city")
      .order("last_name")
      .order("first_name"),
  ]);

  return (
    <InterestEntryForm
      isAdmin={isAdmin}
      userBrandId={profile?.brand_id ?? null}
      brands={brands ?? []}
      contacts={contacts ?? []}
    />
  );
}
