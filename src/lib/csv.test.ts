import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "./csv";

describe("csvField", () => {
  it("returns empty string for null and undefined", () => {
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });

  it("passes plain values through unquoted", () => {
    expect(csvField("hello")).toBe("hello");
    expect(csvField(42)).toBe("42");
    expect(csvField(true)).toBe("true");
  });

  it("quotes values containing commas", () => {
    expect(csvField("Smith, John")).toBe('"Smith, John"');
  });

  it("quotes values containing newlines and CRs", () => {
    expect(csvField("line1\nline2")).toBe('"line1\nline2"');
    expect(csvField("line1\r\nline2")).toBe('"line1\r\nline2"');
  });

  it("escapes internal double quotes by doubling them", () => {
    expect(csvField('he said "hi"')).toBe('"he said ""hi"""');
  });
});

describe("toCsv", () => {
  it("emits a header row and rows in column order with a BOM prefix and \\r\\n line endings", () => {
    const out = toCsv(
      [
        { first: "Ada", last: "Lovelace" },
        { first: "Alan", last: "Turing" },
      ],
      [
        { header: "First", value: (r) => r.first },
        { header: "Last", value: (r) => r.last },
      ],
    );
    expect(out).toBe("﻿First,Last\r\nAda,Lovelace\r\nAlan,Turing");
  });

  it("emits header only for an empty rows array", () => {
    const out = toCsv<{ a: string }>([], [{ header: "A", value: (r) => r.a }]);
    expect(out).toBe("﻿A");
  });
});
