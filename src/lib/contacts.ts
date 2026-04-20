/**
 * Client-side normalization for contact dedup keys.
 * These run before calling the `create_or_link_contact` / `find_contact_by_phone_or_email`
 * RPCs so that "same contact" actually collides on the DB's partial unique indexes.
 *
 * Phone accepts:
 *   - E.164:                +639171234567, +1 (415) 555-0100
 *   - PH local (0-prefix):  09171234567, 0917 123 4567  → +639171234567
 *   - PH int'l (no plus):   639171234567                 → +639171234567
 */

const PHONE_SEPARATORS = /[\s\-()\.]/g;
const E164 = /^\+[1-9]\d{6,14}$/;
const PH_LOCAL_11 = /^0(\d{10})$/;
const PH_INTL_NO_PLUS_12 = /^63\d{10}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(input: string | null | undefined): string | null {
  if (input == null) return null;
  const cleaned = input.replace(PHONE_SEPARATORS, "");
  if (cleaned === "") return null;

  const ph = PH_LOCAL_11.exec(cleaned);
  if (ph) return `+63${ph[1]}`;

  if (PH_INTL_NO_PLUS_12.test(cleaned)) return `+${cleaned}`;

  return E164.test(cleaned) ? cleaned : null;
}

export function normalizeEmail(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "") return null;
  return EMAIL.test(trimmed) ? trimmed : null;
}
