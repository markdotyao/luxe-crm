import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./error-messages";

describe("friendlyAuthError", () => {
  it("replaces the paused-DB error with a retry message", () => {
    expect(friendlyAuthError("Database error querying schema")).toMatch(
      /can't reach the database/i,
    );
  });

  it("simplifies invalid-credential errors", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe(
      "Wrong email or password.",
    );
  });

  it("passes unknown messages through unchanged", () => {
    expect(friendlyAuthError("Email rate limit exceeded")).toBe(
      "Email rate limit exceeded",
    );
  });

  it("falls back to a generic message for nullish input", () => {
    expect(friendlyAuthError(null)).toMatch(/something went wrong/i);
    expect(friendlyAuthError(undefined)).toMatch(/something went wrong/i);
    expect(friendlyAuthError("")).toMatch(/something went wrong/i);
  });
});
