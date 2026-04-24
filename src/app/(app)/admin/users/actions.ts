"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

/**
 * Where invited users land after clicking the email link. Prefer the
 * NEXT_PUBLIC_SITE_URL env var (set this on Vercel to your canonical
 * production/preview URL); fall back to the current request origin so local
 * dev "just works".
 */
async function siteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Could not determine site URL for invite");
  return `${proto}://${host}`;
}

type Role = Enums<"user_role">;

export type InviteInput = {
  email: string;
  role: Role;
  brandId: string | null;
  storeId: string | null;
  firstName: string;
  lastName: string;
};

export type AssignInput = {
  userId: string;
  role: Role;
  brandId: string | null;
  storeId: string | null;
  firstName: string;
  lastName: string;
};

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("admin only");
  }
}

export async function inviteUser(input: InviteInput): Promise<ActionResult> {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email is required" };
  if (input.role !== "admin" && !input.brandId) {
    return { ok: false, error: "Non-admin users must be assigned a brand" };
  }

  const admin = createAdminClient();
  const metadata = {
    role: input.role,
    brand_id: input.role === "admin" ? null : input.brandId,
    store_id: input.role === "admin" ? null : input.storeId,
    first_name: input.firstName.trim() || null,
    last_name: input.lastName.trim() || null,
  };

  const redirectTo = `${await siteUrl()}/auth/callback?next=/reset-password`;
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: metadata,
    redirectTo,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function assignProfile(input: AssignInput): Promise<ActionResult> {
  await requireAdmin();

  if (input.role !== "admin" && !input.brandId) {
    return { ok: false, error: "Non-admin users must be assigned a brand" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_assign_profile", {
    p_user_id: input.userId,
    p_role: input.role,
    p_brand_id: input.role === "admin" ? null : input.brandId,
    p_store_id: input.role === "admin" ? null : input.storeId,
    p_first_name: input.firstName.trim() || null,
    p_last_name: input.lastName.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resendInvite(email: string): Promise<ActionResult> {
  await requireAdmin();

  const admin = createAdminClient();
  const redirectTo = `${await siteUrl()}/auth/callback?next=/reset-password`;
  const { error } = await admin.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
