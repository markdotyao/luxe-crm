import { ServiceUnavailable } from "@/components/service-unavailable";

// Reached via middleware rewrite when the auth/session call itself fails —
// e.g. the Supabase project is paused on the free tier. Public so the
// middleware can rewrite to it without bouncing through /login.
export default function UnavailablePage() {
  return <ServiceUnavailable showHomeLink />;
}
