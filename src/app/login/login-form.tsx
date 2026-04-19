"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Enter your email and password to continue."
      footer={
        <Link href="/forgot-password" style={linkStyle}>
          Forgot your password?
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
        <label style={labelStyle}>
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={formFieldStyle}
          />
        </label>
        {error ? <p style={errorStyle}>{error}</p> : null}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCard>
  );
}
