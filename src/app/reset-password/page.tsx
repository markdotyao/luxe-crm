"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthCard,
  buttonStyle,
  errorStyle,
  formFieldStyle,
  labelStyle,
} from "@/app/(auth)/auth-card";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The email link flow lands on /auth/callback first, which establishes a
    // session and redirects here. If we got here without one, send the user
    // back to request a new link.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setReady(true);
      } else {
        router.replace("/forgot-password?error=invalid_link");
      }
    });
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!ready) {
    return <AuthCard title="Loading…">{null}</AuthCard>;
  }

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a password you haven't used before."
    >
      <form onSubmit={onSubmit} noValidate>
        <label style={labelStyle}>
          New password
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={formFieldStyle}
          />
        </label>
        <label style={labelStyle}>
          Confirm new password
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={formFieldStyle}
          />
        </label>
        {error ? <p style={errorStyle}>{error}</p> : null}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}
