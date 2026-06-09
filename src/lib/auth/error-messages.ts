/**
 * Translate transient / unfriendly Supabase Auth errors into user-facing
 * copy. Anything we don't recognise falls through unchanged.
 */
export function friendlyAuthError(message: string | undefined | null): string {
  if (!message) return "Something went wrong. Please try again.";

  // GoTrue surfaces this when the project is paused (free tier) or the DB
  // is briefly unreachable.
  if (/database error querying schema/i.test(message)) {
    return "We can't reach the database right now. This usually clears up in a few seconds — please try again shortly.";
  }

  // Email/password mismatch.
  if (/invalid login credentials/i.test(message)) {
    return "Wrong email or password.";
  }

  return message;
}
