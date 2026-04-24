"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

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

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: metadata,
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
  const { error } = await admin.auth.admin.inviteUserByEmail(
    email.trim().toLowerCase(),
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
