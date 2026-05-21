-- Many-to-many association between brands and stores.
--
-- Background: stores were modeled as a flat global list (a store could be
-- attached to any brand). That was right at the schema level but the app
-- needs to know which (brand, store) pairs are real — e.g. the admin
-- Intake Forms page should only surface valid signup URLs, and assigning
-- a sales_staff to a brand should only let admins pick stores that carry
-- that brand.
--
-- The relationship is genuinely many-to-many (a multi-brand boutique can
-- carry several brands; a brand can run several boutiques), so a junction
-- table is the right shape.

create table brand_stores (
  brand_id   uuid not null references brands(id) on delete cascade,
  store_id   uuid not null references stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (brand_id, store_id)
);
create index brand_stores_store_id_idx on brand_stores (store_id);

-- ---------------------------------------------------------------------------
-- RLS — same pattern as brands and stores: open read (incl. anon for the
-- public signup form's validation), admin-only writes.
-- ---------------------------------------------------------------------------
alter table brand_stores enable row level security;

create policy brand_stores_select on brand_stores
  for select using (true);

create policy brand_stores_admin_write on brand_stores
  for all
  using      (auth_role() = 'admin')
  with check (auth_role() = 'admin');

grant select on brand_stores to anon;
grant select, insert, update, delete on brand_stores to authenticated;
