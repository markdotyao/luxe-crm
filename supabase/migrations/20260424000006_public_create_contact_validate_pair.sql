-- Defense in depth: refuse public_create_contact submissions where the
-- (brand_slug, store_id) pair isn't recorded in brand_stores. The server
-- page already 404s on a mismatched URL, but a determined caller could
-- still POST to PostgREST directly. The function ran with a store_id
-- check that only verified "this store exists" — not "this store carries
-- this brand."

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

  -- Store is required for the public form (the URL always carries one).
  -- Check that the store carries this brand.
  if p_store_id is null then
    raise exception 'store required';
  end if;

  perform 1 from brand_stores
   where brand_id = v_brand_id and store_id = p_store_id;
  if not found then
    raise exception 'store % is not associated with brand %', p_store_id, p_brand_slug;
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
  from contact_brands cb
  where cb.contact_id = v_contact_id and cb.brand_id = v_brand_id;

  if v_exists > 0 then
    return query select v_contact_id, false, false;
    return;
  end if;

  insert into contact_brands (contact_id, brand_id, store_id, created_by)
  values (v_contact_id, v_brand_id, p_store_id, null);

  return query select v_contact_id, false, true;
end;
$$;
