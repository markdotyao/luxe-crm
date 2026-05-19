-- Public customer-signup surface.
--
-- 1) Add a slug column to brands so the public form URL looks like
--    /customers/panerai/<store-id>/new instead of carrying a uuid.
-- 2) Relax brands/stores SELECT to anon so the public page can validate the
--    URL and render the brand/store name. These tables don't hold PII.
-- 3) Expose a `public_create_contact` SECURITY DEFINER RPC that lets the
--    anon role insert a contact + brand link without bypassing the rest of
--    RLS. Idempotent: if the contact already exists for this brand, return
--    silently (no error) — the customer shouldn't get a different result
--    just because they're already on the books.
--
-- Idempotent throughout so a partial prior run (e.g. failed SET NOT NULL on
-- a row this script didn't backfill) can be re-applied without manual cleanup.

-- ---------------------------------------------------------------------------
-- 1) brands.slug
-- ---------------------------------------------------------------------------
alter table brands add column if not exists slug text;

-- Explicit backfill for the three seed brands.
update brands set slug = 'panerai'   where slug is null and name = 'Panerai';
update brands set slug = 'hublot'    where slug is null and name = 'Hublot';
update brands set slug = 'tag-heuer' where slug is null and name = 'Tag Heuer';

-- Fallback: slugify the name for anything still NULL. Lowercases, collapses
-- non-alphanumeric runs into single hyphens, trims leading/trailing hyphens.
-- Matches the brands_slug_format_ck regex below.
update brands
   set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
 where slug is null;

alter table brands alter column slug set not null;

alter table brands drop constraint if exists brands_slug_uq;
alter table brands add constraint brands_slug_uq unique (slug);

alter table brands drop constraint if exists brands_slug_format_ck;
alter table brands add constraint brands_slug_format_ck
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- ---------------------------------------------------------------------------
-- 2) Relax SELECT to anon for brands and stores.
--    Both are non-PII reference data; the public form needs to read them.
-- ---------------------------------------------------------------------------
drop policy if exists brands_select on brands;
create policy brands_select on brands for select using (true);

drop policy if exists stores_select on stores;
create policy stores_select on stores for select using (true);

grant select on brands, stores to anon;

-- ---------------------------------------------------------------------------
-- 3) public_create_contact
-- ---------------------------------------------------------------------------
create or replace function public_create_contact(
  p_brand_slug text,
  p_store_id   uuid,
  p_first_name text,
  p_last_name  text,
  p_phone      text,
  p_email      text,
  p_dob        date,
  p_gender     gender,
  p_city       text
)
returns table (
  contact_id  uuid,
  was_created boolean,
  was_linked  boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id   uuid;
  v_contact_id uuid;
  v_email_n    text := normalize_email(p_email);
  v_first      text := nullif(trim(p_first_name), '');
  v_last       text := nullif(trim(p_last_name),  '');
  v_city       text := nullif(trim(p_city),       '');
  v_exists     int;
begin
  if v_first is null or v_last is null then
    raise exception 'first name and last name are required';
  end if;

  if p_phone is null and v_email_n is null then
    raise exception 'phone or email required';
  end if;

  select id into v_brand_id from brands where slug = p_brand_slug;
  if v_brand_id is null then
    raise exception 'brand not found: %', p_brand_slug;
  end if;

  if p_store_id is not null then
    perform 1 from stores where id = p_store_id;
    if not found then
      raise exception 'store not found: %', p_store_id;
    end if;
  end if;

  -- Dedup lookup (phone first, then email).
  if p_phone is not null then
    select id into v_contact_id from contacts where phone = p_phone;
  end if;
  if v_contact_id is null and v_email_n is not null then
    select id into v_contact_id from contacts where lower(email) = v_email_n;
  end if;

  if v_contact_id is null then
    insert into contacts (first_name, last_name, dob, gender, phone, email, city)
    values (v_first, v_last, p_dob, p_gender, p_phone, v_email_n, v_city)
    returning id into v_contact_id;

    insert into contact_brands (contact_id, brand_id, store_id, created_by)
    values (v_contact_id, v_brand_id, p_store_id, null);

    return query select v_contact_id, true, false;
    return;
  end if;

  -- Already linked to this brand? Idempotent success.
  select count(*) into v_exists
  from contact_brands
  where contact_id = v_contact_id and brand_id = v_brand_id;

  if v_exists > 0 then
    return query select v_contact_id, false, false;
    return;
  end if;

  insert into contact_brands (contact_id, brand_id, store_id, created_by)
  values (v_contact_id, v_brand_id, p_store_id, null);

  return query select v_contact_id, false, true;
end;
$$;

revoke all on function public_create_contact(text, uuid, text, text, text, text, date, gender, text) from public;
grant execute on function public_create_contact(text, uuid, text, text, text, text, date, gender, text)
  to anon, authenticated;
