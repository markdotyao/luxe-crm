"use client";

import { ArrowLeft, Plus, Trash2 } from "lucide-react";
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
import { normalizeEmail, normalizePhone } from "@/lib/contacts";
import { createClient } from "@/lib/supabase/client";
import type { Enums, Tables } from "@/lib/supabase/types";

type GenderValue = "" | Enums<"gender">;
type BrandOption = { id: string; name: string };
type ModelOption = { id: string; reference: string; name: string | null };

type ContactOption = Pick<
  Tables<"contacts">,
  "id" | "first_name" | "last_name" | "dob" | "gender" | "phone" | "email" | "city"
>;

type ModelSlot = { modelId: string; notes: string };

const MAX_MODELS = 5;

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "", label: "Select…" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function InterestEntryForm({
  isAdmin,
  userBrandId,
  brands,
  contacts,
}: {
  isAdmin: boolean;
  userBrandId: string | null;
  brands: BrandOption[];
  contacts: ContactOption[];
}) {
  const router = useRouter();

  // ---- Contact selection (existing vs new) -------------------------------
  const [existingContactId, setExistingContactId] = useState<string>("");
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === existingContactId) ?? null,
    [contacts, existingContactId],
  );
  const useExisting = selectedContact !== null;

  // ---- New-contact fields (mirrored from selected existing when present) -
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<GenderValue>("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (selectedContact) {
      setFirstName(selectedContact.first_name);
      setLastName(selectedContact.last_name);
      setPhone(selectedContact.phone ?? "");
      setEmail(selectedContact.email ?? "");
      setDob(selectedContact.dob ?? "");
      setGender((selectedContact.gender ?? "") as GenderValue);
      setCity(selectedContact.city ?? "");
    } else {
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setDob("");
      setGender("");
      setCity("");
    }
  }, [selectedContact]);

  // ---- Brand + models -----------------------------------------------------
  const [brandId, setBrandId] = useState<string>(
    isAdmin ? "" : (userBrandId ?? ""),
  );
  const [models, setModels] = useState<ModelOption[]>([]);
  const [slots, setSlots] = useState<ModelSlot[]>([
    { modelId: "", notes: "" },
  ]);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setSlots([{ modelId: "", notes: "" }]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("models")
      .select("id, reference, name")
      .eq("brand_id", brandId)
      .order("reference")
      .then(({ data }) => {
        if (cancelled) return;
        setModels(data ?? []);
        setSlots([{ modelId: "", notes: "" }]);
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  function updateSlot(index: number, patch: Partial<ModelSlot>) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }
  function addSlot() {
    if (slots.length >= MAX_MODELS) return;
    setSlots((prev) => [...prev, { modelId: "", notes: "" }]);
  }
  function removeSlot(index: number) {
    setSlots((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  const filledSlots = slots.filter((s) => s.modelId !== "");
  const duplicateModelIds = (() => {
    const seen = new Set<string>();
    for (const s of filledSlots) {
      if (seen.has(s.modelId)) return true;
      seen.add(s.modelId);
    }
    return false;
  })();

  // ---- Submission ---------------------------------------------------------
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const hasContactMethod = Boolean(normalizedPhone || normalizedEmail);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit =
    !submitting &&
    brandId !== "" &&
    filledSlots.length > 0 &&
    !duplicateModelIds &&
    (useExisting ||
      (firstName.trim() !== "" &&
        lastName.trim() !== "" &&
        hasContactMethod));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();

    // 1) Resolve contact_id — use existing or create via the dedup RPC.
    let contactId: string;

    if (useExisting && selectedContact) {
      contactId = selectedContact.id;
    } else {
      const { data, error } = await supabase.rpc("create_or_link_contact", {
        p_first_name: firstName.trim(),
        p_last_name: lastName.trim(),
        p_phone: normalizedPhone,
        p_email: normalizedEmail,
        p_dob: dob || null,
        p_gender: gender || null,
        p_city: city.trim() || null,
        p_brand_id: brandId,
        p_store_id: null,
        p_notes: null,
      });
      if (error || !data?.[0]) {
        setSubmitting(false);
        setSubmitError(error?.message ?? "Couldn't create the contact.");
        return;
      }
      contactId = data[0].contact_id;
    }

    // 2) Insert each interest entry.
    const rows = filledSlots.map((s) => ({
      contact_id: contactId,
      model_id: s.modelId,
      notes: s.notes.trim() || null,
    }));

    const { error: insertErr } = await supabase
      .from("interest_entries")
      .insert(rows);

    if (insertErr) {
      setSubmitting(false);
      setSubmitError(
        insertErr.code === "23505"
          ? "That contact is already on the list for one of these models."
          : insertErr.message,
      );
      return;
    }

    toast.success(
      `Added to interest list (${filledSlots.length} model${filledSlots.length === 1 ? "" : "s"})`,
    );
    router.push("/interest");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/interest">
            <ArrowLeft />
            Back to interest list
          </Link>
        </Button>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {/* ---- Customer section ------------------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
            <CardDescription>
              Pick an existing contact, or fill in the fields to create a new
              one.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Existing contact" htmlFor="existing_contact">
              <SelectNative
                id="existing_contact"
                value={existingContactId}
                onChange={(e) => setExistingContactId(e.target.value)}
              >
                <option value="">— Create a new contact —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {contactLabel(c)}
                  </option>
                ))}
              </SelectNative>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" htmlFor="first_name" required>
                <Input
                  id="first_name"
                  required={!useExisting}
                  disabled={useExisting}
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last name" htmlFor="last_name" required>
                <Input
                  id="last_name"
                  required={!useExisting}
                  disabled={useExisting}
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>

              <Field
                label="Phone"
                htmlFor="phone"
                hint={
                  useExisting
                    ? undefined
                    : "E.164 format, e.g. +639175550100"
                }
              >
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={useExisting}
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
                  disabled={useExisting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Date of birth" htmlFor="dob">
                <Input
                  id="dob"
                  type="date"
                  disabled={useExisting}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </Field>
              <Field label="Gender" htmlFor="gender">
                <SelectNative
                  id="gender"
                  disabled={useExisting}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as GenderValue)}
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
                  disabled={useExisting}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>
            </div>

            {!useExisting ? (
              <p className="text-xs text-muted-foreground">
                Phone or email is required for new contacts. Same-brand
                duplicates are blocked.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* ---- Models section ------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Models of interest</CardTitle>
            <CardDescription>
              Up to five model references. Notes are optional per model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field
              label="Brand"
              htmlFor="brand"
              required
              hint={isAdmin ? undefined : "Locked to your assigned brand"}
            >
              <SelectNative
                id="brand"
                required
                disabled={!isAdmin && brands.length <= 1}
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                {isAdmin ? <option value="">Select brand…</option> : null}
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </SelectNative>
            </Field>

            <div className="space-y-3">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_2fr_auto]"
                >
                  <div className="space-y-2">
                    <Label htmlFor={`model-${i}`}>Model {i + 1}</Label>
                    <SelectNative
                      id={`model-${i}`}
                      disabled={!brandId || models.length === 0}
                      value={slot.modelId}
                      onChange={(e) =>
                        updateSlot(i, { modelId: e.target.value })
                      }
                    >
                      <option value="">
                        {brandId
                          ? models.length === 0
                            ? "No models for this brand"
                            : "Select model…"
                          : "Select a brand first"}
                      </option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {modelLabel(m)}
                        </option>
                      ))}
                    </SelectNative>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${i}`}>Notes</Label>
                    <Textarea
                      id={`notes-${i}`}
                      rows={2}
                      disabled={!slot.modelId}
                      value={slot.notes}
                      onChange={(e) =>
                        updateSlot(i, { notes: e.target.value })
                      }
                      placeholder="e.g. wants in titanium, size 42"
                    />
                  </div>

                  <div className="flex items-end sm:items-start sm:pt-7">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSlot(i)}
                      disabled={slots.length <= 1}
                      aria-label={`Remove model ${i + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}

              {slots.length < MAX_MODELS ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSlot}
                  disabled={!brandId}
                >
                  <Plus />
                  Add another model
                </Button>
              ) : null}

              {duplicateModelIds ? (
                <p className="text-xs text-destructive">
                  Pick each model only once.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {submitError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t save</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" type="button">
            <Link href="/interest">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {submitting ? "Saving…" : "Save entry"}
          </Button>
        </div>
      </form>
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

function contactLabel(c: ContactOption) {
  const name = `${c.first_name} ${c.last_name}`.trim();
  const parts = [name];
  if (c.phone) parts.push(c.phone);
  if (c.email) parts.push(c.email);
  return parts.join(" — ");
}

function modelLabel(m: ModelOption) {
  return m.name ? `${m.reference} — ${m.name}` : m.reference;
}
