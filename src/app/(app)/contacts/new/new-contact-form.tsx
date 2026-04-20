"use client";

import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { ProfileRole } from "@/lib/auth/session";
import { normalizeEmail, normalizePhone } from "@/lib/contacts";
import {
  type DedupMatch,
  type DedupStatus,
  blocksSubmit,
  dedupStatusFrom,
} from "@/lib/contacts/dedup";
import { createClient } from "@/lib/supabase/client";

type BrandOption = { id: string; name: string };
type StoreOption = { id: string; name: string };

type Props = {
  role: ProfileRole;
  userBrandId: string | null;
  userStoreId: string | null;
  brands: BrandOption[];
  stores: StoreOption[];
};

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Select…" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function NewContactForm({
  role,
  userBrandId,
  userStoreId,
  brands,
  stores,
}: Props) {
  const router = useRouter();
  const isAdmin = role === "admin";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [brandId, setBrandId] = useState<string>(
    userBrandId ?? brands[0]?.id ?? "",
  );
  const [storeId, setStoreId] = useState<string>(userStoreId ?? "");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dedupStatus, setDedupStatus] = useState<DedupStatus>({ kind: "idle" });

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);

  const activeBrandId = isAdmin ? brandId : (userBrandId ?? "");

  // Debounced dedup lookup.
  useEffect(() => {
    if (!normalizedPhone && !normalizedEmail) {
      setDedupStatus({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setDedupStatus({ kind: "checking" });
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "find_contact_by_phone_or_email",
        { p_phone: normalizedPhone, p_email: normalizedEmail },
      );
      if (cancelled) return;
      if (error) {
        setDedupStatus({ kind: "idle" });
        return;
      }
      const match = (data as DedupMatch[] | null)?.[0] ?? null;
      setDedupStatus(dedupStatusFrom(match, activeBrandId || null));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedPhone, normalizedEmail, activeBrandId]);

  const hasContactMethod = Boolean(normalizedPhone || normalizedEmail);
  const canSubmit =
    !submitting &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    hasContactMethod &&
    activeBrandId !== "" &&
    !blocksSubmit(dedupStatus);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("create_or_link_contact", {
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_phone: normalizedPhone,
      p_email: normalizedEmail,
      p_dob: dob || null,
      p_gender: gender || null,
      p_city: city.trim() || null,
      p_brand_id: activeBrandId,
      p_store_id: storeId || null,
      p_notes: notes.trim() || null,
    });

    if (error) {
      setSubmitting(false);
      setSubmitError(error.message);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    toast.success(
      result?.was_linked
        ? `${firstName.trim()} ${lastName.trim()} linked to your brand`
        : `${firstName.trim()} ${lastName.trim()} added`,
    );

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/">
            <ArrowLeft />
            Back to contacts
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New contact</CardTitle>
          <CardDescription>
            Phone or email is required. Contacts are deduplicated by phone
            first, then email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" htmlFor="first_name" required>
                <Input
                  id="first_name"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last name" htmlFor="last_name" required>
                <Input
                  id="last_name"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>

              <Field
                label="Phone"
                htmlFor="phone"
                hint="E.164 format, e.g. +639175550100"
              >
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63…"
                />
              </Field>
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Date of birth" htmlFor="dob">
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </Field>
              <Field label="Gender" htmlFor="gender">
                <SelectNative
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field label="City" htmlFor="city">
                <Input
                  id="city"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>

              <Field
                label="Brand"
                htmlFor="brand"
                required
                hint={isAdmin ? undefined : "Assigned by your administrator"}
              >
                <SelectNative
                  id="brand"
                  required
                  disabled={!isAdmin}
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
            </div>

            <Field label="Notes" htmlFor="notes">
              <Textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            <DedupBanner status={dedupStatus} brands={brands} brandId={activeBrandId} />

            {submitError ? (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t save contact</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link href="/">Cancel</Link>
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? "Saving…" : "Save contact"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DedupBanner({
  status,
  brands,
  brandId,
}: {
  status: DedupStatus;
  brands: BrandOption[];
  brandId: string;
}) {
  if (status.kind === "idle" || status.kind === "checking") return null;
  if (status.kind === "new") return null;

  if (status.kind === "exists-same-brand") {
    return (
      <Alert variant="destructive">
        <Info />
        <AlertTitle>This contact already exists for this brand</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>Saving is disabled. Open the existing contact instead.</p>
          <Button asChild size="sm" variant="outline">
            <Link href={`/contacts/${status.contactId}`}>
              View existing contact
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const thisBrand = brands.find((b) => b.id === brandId)?.name;
  return (
    <Alert variant="warning">
      <Info />
      <AlertTitle>This contact already exists under another brand</AlertTitle>
      <AlertDescription>
        {thisBrand
          ? `Saving will add ${thisBrand} to their record — no duplicate contact will be created.`
          : "Saving will add your brand to their record — no duplicate contact will be created."}
      </AlertDescription>
    </Alert>
  );
}
