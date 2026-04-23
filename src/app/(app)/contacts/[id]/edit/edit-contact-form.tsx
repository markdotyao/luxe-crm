"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
import { normalizeEmail, normalizePhone } from "@/lib/contacts";
import { createClient } from "@/lib/supabase/client";
import type { Enums, Tables } from "@/lib/supabase/types";

type GenderValue = "" | Enums<"gender">;

type ContactFields = Pick<
  Tables<"contacts">,
  "id" | "first_name" | "last_name" | "dob" | "gender" | "phone" | "email" | "city"
>;

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "", label: "Not set" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function EditContactForm({ contact }: { contact: ContactFields }) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(contact.first_name);
  const [lastName, setLastName] = useState(contact.last_name);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [dob, setDob] = useState(contact.dob ?? "");
  const [gender, setGender] = useState<GenderValue>(contact.gender ?? "");
  const [city, setCity] = useState(contact.city ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);

  const phoneInvalid = phone.trim() !== "" && normalizedPhone === null;
  const emailInvalid = email.trim() !== "" && normalizedEmail === null;
  const hasContactMethod = Boolean(normalizedPhone || normalizedEmail);

  const canSubmit =
    !submitting &&
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    hasContactMethod &&
    !phoneInvalid &&
    !emailInvalid;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("contacts")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        dob: dob || null,
        gender: gender || null,
        city: city.trim() || null,
      })
      .eq("id", contact.id);

    if (error) {
      setSubmitting(false);
      setSubmitError(
        error.code === "23505"
          ? "Another contact already uses that phone or email."
          : error.message,
      );
      return;
    }

    toast.success("Contact updated");
    router.push(`/contacts/${contact.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={`/contacts/${contact.id}`}>
            <ArrowLeft />
            Back to contact
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit contact</CardTitle>
          <CardDescription>
            Phone or email is required. Brand links are managed from the
            contact page.
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
                error={phoneInvalid ? "Not a valid phone number" : undefined}
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
              <Field
                label="Email"
                htmlFor="email"
                error={emailInvalid ? "Not a valid email" : undefined}
              >
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
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>
            </div>

            {submitError ? (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t save changes</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link href={`/contacts/${contact.id}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? "Saving…" : "Save changes"}
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
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
