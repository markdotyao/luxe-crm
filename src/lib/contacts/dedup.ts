/**
 * Maps the result of the `find_contact_by_phone_or_email` RPC into a UI state.
 * The RPC returns 0 rows when nothing matches, or 1 row with the contact id
 * and the brand ids it's already linked to.
 */

export type DedupMatch = {
  contact_id: string;
  matched_on: string | null;
  existing_brand_ids: string[] | null;
};

export type DedupStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "new" }
  | { kind: "exists-same-brand"; contactId: string }
  | {
      kind: "exists-other-brand";
      contactId: string;
      existingBrandIds: string[];
    };

export function dedupStatusFrom(
  match: DedupMatch | null | undefined,
  currentBrandId: string | null,
): DedupStatus {
  if (!match) return { kind: "new" };

  const existingBrandIds = match.existing_brand_ids ?? [];

  if (currentBrandId && existingBrandIds.includes(currentBrandId)) {
    return { kind: "exists-same-brand", contactId: match.contact_id };
  }

  return {
    kind: "exists-other-brand",
    contactId: match.contact_id,
    existingBrandIds,
  };
}

export function blocksSubmit(status: DedupStatus): boolean {
  return status.kind === "exists-same-brand";
}
