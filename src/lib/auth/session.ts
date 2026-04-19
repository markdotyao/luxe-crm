import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "admin" | "brand_manager" | "sales_staff";

export type Profile = {
  id: string;
  role: ProfileRole;
  brand_id: string | null;
  store_id: string | null;
  first_name: string | null;
  last_name: string | null;
};

/**
 * Cached within a single server render so layouts and pages can both read
 * the session without duplicate round trips.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, brand_id, store_id, first_name, last_name")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
});

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
