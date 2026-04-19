"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AuthCard,
  buttonStyle,
  errorStyle,
  formFieldStyle,
  labelStyle,
  linkStyle,
} from "@/app/(auth)/auth-card";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We've sent a password-reset link. It may take a minute to arrive."
        footer={
          <Link href="/login" style={linkStyle}>
            Back to sign in
          </Link>
        }
      >
        <p style={{ fontSize: "0.875rem", color: "#555" }}>
          If you don&apos;t see it, check your spam folder or confirm you&apos;re
          using the email your admin registered.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new password."
      footer={
        <Link href="/login" style={linkStyle}>
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <label style={labelStyle}>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={formFieldStyle}
          />
        </label>
        {error ? <p style={errorStyle}>{error}</p> : null}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
