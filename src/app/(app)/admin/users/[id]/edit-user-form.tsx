"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import type { Enums } from "@/lib/supabase/types";
import { assignProfile, resendInvite } from "../actions";

type Role = Enums<"user_role">;
type Option = { id: string; name: string };

type UserRow = {
  id: string;
  email: string;
  role: Role;
  brand_id: string | null;
  store_id: string | null;
  first_name: string | null;
  last_name: string | null;
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "brand_manager", label: "Brand manager" },
  { value: "sales_staff", label: "Sales staff" },
];

export function EditUserForm({
  user,
  brands,
  stores,
}: {
  user: UserRow;
  brands: Option[];
  stores: Option[];
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(user.role);
  const [brandId, setBrandId] = useState(user.brand_id ?? "");
  const [storeId, setStoreId] = useState(user.store_id ?? "");
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResending] = useTransition();

  const needsBrand = role !== "admin";
  const canSubmit = !isPending && (!needsBrand || brandId !== "");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await assignProfile({
        userId: user.id,
        role,
        brandId: needsBrand ? brandId : null,
        storeId: needsBrand && storeId ? storeId : null,
        firstName,
        lastName,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("User updated");
      router.push("/admin/users");
      router.refresh();
    });
  }

  function onResend() {
    startResending(async () => {
      const result = await resendInvite(user.email);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Invite resent to ${user.email}`);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit user</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="first_name">
              <Input
                id="first_name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Field>
            <Field label="Last name" htmlFor="last_name">
              <Input
                id="last_name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>

            <Field label="Role" htmlFor="role" required>
              <SelectNative
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </SelectNative>
            </Field>

            {needsBrand ? (
              <>
                <Field label="Brand" htmlFor="brand" required>
                  <SelectNative
                    id="brand"
                    required
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                  >
                    {brands.length === 0 ? (
                      <option value="">No brands available</option>
                    ) : (
                      <>
                        <option value="">Select a brand…</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </>
                    )}
                  </SelectNative>
                </Field>
                <Field label="Store" htmlFor="store">
                  <SelectNative
                    id="store"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                  >
                    <option value="">None</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </SelectNative>
                </Field>
              </>
            ) : null}
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t save changes</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onResend}
              disabled={isResending}
            >
              {isResending ? "Resending…" : "Resend invite"}
            </Button>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" type="button">
                <Link href="/admin/users">Cancel</Link>
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}
