"use client";

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
import { inviteUser } from "./actions";

type Role = Enums<"user_role">;
type Option = { id: string; name: string };

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "brand_manager", label: "Brand manager" },
  { value: "sales_staff", label: "Sales staff" },
];

export function InviteUserForm({
  brands,
  stores,
}: {
  brands: Option[];
  stores: Option[];
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("sales_staff");
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [storeId, setStoreId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const needsBrand = role !== "admin";
  const canSubmit =
    !isPending && email.trim() !== "" && (!needsBrand || brandId !== "");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await inviteUser({
        email,
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
      toast.success(`Invite sent to ${email.trim()}`);
      setEmail("");
      setFirstName("");
      setLastName("");
      setStoreId("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invite a user</CardTitle>
        <CardDescription>
          They&apos;ll get an email invite to set a password and log in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="invite_email" required>
              <Input
                id="invite_email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Role" htmlFor="invite_role" required>
              <SelectNative
                id="invite_role"
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

            <Field label="First name" htmlFor="invite_first_name">
              <Input
                id="invite_first_name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Field>
            <Field label="Last name" htmlFor="invite_last_name">
              <Input
                id="invite_last_name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Field>

            {needsBrand ? (
              <>
                <Field label="Brand" htmlFor="invite_brand" required>
                  <SelectNative
                    id="invite_brand"
                    required
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                  >
                    {brands.length === 0 ? (
                      <option value="">No brands available</option>
                    ) : (
                      brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))
                    )}
                  </SelectNative>
                </Field>
                <Field label="Store" htmlFor="invite_store">
                  <SelectNative
                    id="invite_store"
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
              <AlertTitle>Couldn&apos;t send invite</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? "Sending…" : "Send invite"}
            </Button>
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
