-- Disambiguate column references inside contact-creation RPCs.
--
-- Both `create_or_link_contact` and `public_create_contact` use
-- `returns table (contact_id uuid, ...)`. That declares `contact_id` as an
-- OUT parameter, so any bare reference to `contact_id` inside the function
-- body is ambiguous when a query also has a column of the same name on
-- contact_brands. Postgres surfaces this as:
--
--   ERROR: column reference "contact_id" is ambiguous
--   DETAIL: It could refer to either a PL/pgSQL variable or a table column.
--
-- The fix is to alias `contact_brands` (cb) in every WHERE / INSERT path
-- and qualify the column refs. We re-create both functions with the same
-- signatures so no callers break.

create or replace function create_or_link_contact(
  p_first_name text,
  p_last_name  text,
  p_phone      text,
  p_email      text,
  p_dob        date,
  p_gender     gender,
  p_city       text,
  p_brand_id   uuid,
  p_store_id   uuid,
  p_notes      text
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
  v_uid        uuid := auth.uid();
  v_role       user_role;
  v_user_brand uuid;
  v_contact_id uuid;
  v_email_n    text := normalize_email(p_email);
  v_exists     int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select role, brand_id into v_role, v_user_brand from profiles where id = v_uid;
  if v_role is null then
    raise exception 'caller has no profile';
  end if;

  if v_role <> 'admin' and p_brand_id <> v_user_brand then
    raise exception 'cannot create contact for another brand';
  end if;

  if p_phone is null and v_email_n is null then
    raise exception 'phone or email required';
  end if;

  if p_phone is not null then
    select id into v_contact_id from contacts where phone = p_phone;
  end if;
  if v_contact_id is null and v_email_n is not null then
    select id into v_contact_id from contacts where lower(email) = v_email_n;
  end if;

  if v_contact_id is null then
    insert into contacts (first_name, last_name, dob, gender, phone, email, city)
    values (p_first_name, p_last_name, p_dob, p_gender, p_phone, v_email_n, p_city)
    returning id into v_contact_id;

    insert into contact_brands (contact_id, brand_id, store_id, created_by, notes)
    values (v_contact_id, p_brand_id, p_store_id, v_uid, p_notes);

    return query select v_contact_id, true, false;
    return;
  end if;

  select count(*) into v_exists
  from contact_brands cb
  where cb.contact_id = v_contact_id and cb.brand_id = p_brand_id;

  if v_exists > 0 then
    raise exception 'contact already exists for this brand'
      using errcode = 'unique_violation';
  end if;

  insert into contact_brands (contact_id, brand_id, store_id, created_by, notes)
  values (v_contact_id, p_brand_id, p_store_id, v_uid, p_notes);

  return query select v_contact_id, false, true;
end;
$$;

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
