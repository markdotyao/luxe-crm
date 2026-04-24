-- 1) Grant table privileges to the `authenticated` role.
--    RLS is already enabled on every public table, so these grants are the
--    gate that prevents "permission denied for table X" while RLS decides
--    which rows each user actually sees.
--
-- 2) Expose an admin-only RPC that joins profiles with auth.users so the
--    admin UI can list emails without needing the service-role key in the
--    browser.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  brands,
  stores,
  profiles,
  contacts,
  contact_brands
to authenticated;

-- admin_list_users: one row per profile + the auth email.
-- SECURITY DEFINER so the function can read auth.users; the first statement
-- re-checks that the caller is an admin.
create or replace function admin_list_users()
returns table (
  id         uuid,
  email      text,
  role       user_role,
  brand_id   uuid,
  store_id   uuid,
  first_name text,
  last_name  text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth_role() <> 'admin' then
    raise exception 'admin only';
  end if;

  return query
    select
      p.id,
      u.email::text,
      p.role,
      p.brand_id,
      p.store_id,
      p.first_name,
      p.last_name,
      p.created_at
    from profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke all on function admin_list_users() from public;
grant execute on function admin_list_users() to authenticated;

-- admin_assign_profile: atomically update role + brand + store + name on an
-- existing profile. Needed because the profiles_admin_scope_ck constraint
-- would reject a two-step update (e.g. role='admin' first, then clearing
-- brand_id). A single UPDATE satisfies the check transactionally.
create or replace function admin_assign_profile(
  p_user_id    uuid,
  p_role       user_role,
  p_brand_id   uuid,
  p_store_id   uuid,
  p_first_name text,
  p_last_name  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brand_id uuid := p_brand_id;
  v_store_id uuid := p_store_id;
begin
  if auth_role() <> 'admin' then
    raise exception 'admin only';
  end if;

  -- Enforce the admin-scope rule at the RPC boundary too: admins must not
  -- carry a brand or store, regardless of what the client sent.
  if p_role = 'admin' then
    v_brand_id := null;
    v_store_id := null;
  end if;

  update profiles
     set role       = p_role,
         brand_id   = v_brand_id,
         store_id   = v_store_id,
         first_name = p_first_name,
         last_name  = p_last_name
   where id = p_user_id;

  if not found then
    raise exception 'profile not found: %', p_user_id;
  end if;
end;
$$;

revoke all on function admin_assign_profile(uuid, user_role, uuid, uuid, text, text) from public;
grant execute on function admin_assign_profile(uuid, user_role, uuid, uuid, text, text) to authenticated;
