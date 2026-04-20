import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizePhone } from "./contacts";

describe("normalizePhone", () => {
  it("strips whitespace, dashes, parens, and dots", () => {
    expect(normalizePhone("+1 (415) 555-0100")).toBe("+14155550100");
    expect(normalizePhone("+63.917.555.0100")).toBe("+639175550100");
  });

  it("converts PH local 0-prefix to +63", () => {
    expect(normalizePhone("09171234567")).toBe("+639171234567");
    expect(normalizePhone("0917 123 4567")).toBe("+639171234567");
    expect(normalizePhone("0917-123-4567")).toBe("+639171234567");
    expect(normalizePhone("(0917) 123-4567")).toBe("+639171234567");
  });

  it("adds plus to PH international without it", () => {
    expect(normalizePhone("639171234567")).toBe("+639171234567");
    expect(normalizePhone("63 917 123 4567")).toBe("+639171234567");
  });

  it("preserves explicit E.164", () => {
    expect(normalizePhone("+639171234567")).toBe("+639171234567");
    expect(normalizePhone("+63 917 123 4567")).toBe("+639171234567");
  });

  it("canonicalizes so equivalent PH inputs collide", () => {
    const expected = "+639171234567";
    expect(normalizePhone("09171234567")).toBe(expected);
    expect(normalizePhone("+639171234567")).toBe(expected);
    expect(normalizePhone("639171234567")).toBe(expected);
    expect(normalizePhone("+63 917 123 4567")).toBe(expected);
  });

  it("returns null for nullish, empty, or invalid input", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("415-555-0100")).toBeNull();   // missing country info
    expect(normalizePhone("9171234567")).toBeNull();      // 10 digits, no 0 or +63
    expect(normalizePhone("+0123456789")).toBeNull();    // leading 0 after +
    expect(normalizePhone("+1abc4155550100")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Alice@Example.COM  ")).toBe("alice@example.com");
  });

  it("returns null for nullish, empty, or invalid input", () => {
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail("   ")).toBeNull();
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
  });
});
