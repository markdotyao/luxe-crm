"use client";

import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import type { Enums } from "@/lib/supabase/types";

type GenderValue = "" | Enums<"gender">;

type Props = {
  brandSlug: string;
  brandName: string;
  storeId: string;
  storeName: string;
};

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "", label: "Prefer not to say" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function PublicContactForm({
  brandSlug,
  brandName,
  storeId,
  storeName,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<GenderValue>("");
  const [city, setCity] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
    const { error } = await supabase.rpc("public_create_contact", {
      p_brand_slug: brandSlug,
      p_store_id: storeId,
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_phone: normalizedPhone,
      p_email: normalizedEmail,
      p_dob: dob || null,
      p_gender: gender || null,
      p_city: city.trim() || null,
    });

    if (error) {
      setSubmitting(false);
      setSubmitError("We couldn't save your details. Please try again.");
      return;
    }

    setDone(true);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl items-start justify-center px-4 py-8 md:py-16">
      <div className="w-full space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {brandName}
          </p>
          <p className="text-xs text-muted-foreground">{storeName}</p>
        </div>

        {done ? (
          <Card>
            <CardHeader className="items-center text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <CardTitle>Thank you</CardTitle>
              <CardDescription>
                We&apos;ve added you to the {brandName} list. Our team at{" "}
                {storeName} will be in touch.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Join the {brandName} list</CardTitle>
              <CardDescription>
                Share your details so {storeName} can keep you posted on new
                pieces and private events.
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
                    hint="Include country code, e.g. +639175550100"
                    error={
                      phoneInvalid ? "Not a valid phone number" : undefined
                    }
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
                      onChange={(e) =>
                        setGender(e.target.value as GenderValue)
                      }
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

                <p className="text-xs text-muted-foreground">
                  Phone or email is required.
                </p>

                {submitError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                <Button type="submit" disabled={!canSubmit} className="w-full">
                  {submitting ? "Submitting…" : "Submit"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
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
