import { describe, expect, it } from "vitest";
import { blocksSubmit, dedupStatusFrom } from "./dedup";

describe("dedupStatusFrom", () => {
  it("returns 'new' when there's no match", () => {
    expect(dedupStatusFrom(null, "brand-a")).toEqual({ kind: "new" });
    expect(dedupStatusFrom(undefined, "brand-a")).toEqual({ kind: "new" });
  });

  it("returns 'exists-same-brand' when the current brand is in the list", () => {
    const status = dedupStatusFrom(
      {
        contact_id: "c1",
        matched_on: "phone",
        existing_brand_ids: ["brand-a", "brand-b"],
      },
      "brand-a",
    );
    expect(status).toEqual({ kind: "exists-same-brand", contactId: "c1" });
  });

  it("returns 'exists-other-brand' when the current brand isn't in the list", () => {
    const status = dedupStatusFrom(
      {
        contact_id: "c1",
        matched_on: "email",
        existing_brand_ids: ["brand-b"],
      },
      "brand-a",
    );
    expect(status).toEqual({
      kind: "exists-other-brand",
      contactId: "c1",
      existingBrandIds: ["brand-b"],
    });
  });

  it("treats a null existing_brand_ids array as empty (still other-brand)", () => {
    const status = dedupStatusFrom(
      { contact_id: "c1", matched_on: "phone", existing_brand_ids: null },
      "brand-a",
    );
    expect(status).toEqual({
      kind: "exists-other-brand",
      contactId: "c1",
      existingBrandIds: [],
    });
  });

  it("returns 'exists-other-brand' when currentBrandId is null (admin viewing)", () => {
    const status = dedupStatusFrom(
      {
        contact_id: "c1",
        matched_on: "phone",
        existing_brand_ids: ["brand-a"],
      },
      null,
    );
    expect(status.kind).toBe("exists-other-brand");
  });
});

describe("blocksSubmit", () => {
  it("blocks only when the contact already exists in the current brand", () => {
    expect(blocksSubmit({ kind: "idle" })).toBe(false);
    expect(blocksSubmit({ kind: "checking" })).toBe(false);
    expect(blocksSubmit({ kind: "new" })).toBe(false);
    expect(
      blocksSubmit({
        kind: "exists-other-brand",
        contactId: "c1",
        existingBrandIds: [],
      }),
    ).toBe(false);
    expect(
      blocksSubmit({ kind: "exists-same-brand", contactId: "c1" }),
    ).toBe(true);
  });
});
