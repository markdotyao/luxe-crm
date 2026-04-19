import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-routes";

describe("isPublicPath", () => {
  it("allows the known public entry points", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/forgot-password")).toBe(true);
    expect(isPublicPath("/reset-password")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("gates app routes", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/contacts")).toBe(false);
    expect(isPublicPath("/contacts/123")).toBe(false);
  });

  it("matches nested segments of a public prefix", () => {
    expect(isPublicPath("/auth/callback/xyz")).toBe(true);
  });

  it("does not treat lookalike paths as public", () => {
    expect(isPublicPath("/loginx")).toBe(false);
    expect(isPublicPath("/login-help")).toBe(false);
    expect(isPublicPath("/reset-password-help")).toBe(false);
  });
});
