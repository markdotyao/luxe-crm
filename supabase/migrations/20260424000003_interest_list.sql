-- Interest List: track customer waitlists for specific model references.
--
-- Adds two tables:
--   models           - per-brand catalog of references (e.g. Panerai PAM00382)
--   interest_entries - one row per (contact, model), with per-entry notes
--
-- RLS:
--   models           - read by any authenticated user; write by admin only
--   interest_entries - scoped by the model's brand (admin sees all)

create table models (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references brands(id) on delete restrict,
  reference  text not null,
  name       text,
  created_at timestamptz not null default now(),
  constraint models_brand_reference_uq unique (brand_id, reference)
);
create index models_brand_id_idx on models (brand_id);

create table interest_entries (
  id         uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  model_id   uuid not null references models(id)   on delete cascade,
  notes      text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint interest_entries_contact_model_uq unique (contact_id, model_id)
);
create index interest_entries_model_id_idx   on interest_entries (model_id);
create index interest_entries_contact_id_idx on interest_entries (contact_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table models           enable row level security;
alter table interest_entries enable row level security;

create policy models_select on models
  for select using (auth.uid() is not null);

create policy models_admin_write on models
  for all
  using      (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- interest_entries inherits brand scope from its model: a non-admin can only
-- see / write entries whose model belongs to their own brand.
create policy interest_entries_select on interest_entries
  for select using (
    auth_role() = 'admin'
    or exists (
      select 1 from models m
      where m.id = interest_entries.model_id
        and m.brand_id = auth_brand_id()
    )
  );

create policy interest_entries_insert on interest_entries
  for insert with check (
    auth_role() = 'admin'
    or exists (
      select 1 from models m
      where m.id = interest_entries.model_id
        and m.brand_id = auth_brand_id()
    )
  );

create policy interest_entries_update on interest_entries
  for update
  using (
    auth_role() = 'admin'
    or exists (
      select 1 from models m
      where m.id = interest_entries.model_id
        and m.brand_id = auth_brand_id()
    )
  )
  with check (
    auth_role() = 'admin'
    or exists (
      select 1 from models m
      where m.id = interest_entries.model_id
        and m.brand_id = auth_brand_id()
    )
  );

create policy interest_entries_delete on interest_entries
  for delete using (
    auth_role() = 'admin'
    or exists (
      select 1 from models m
      where m.id = interest_entries.model_id
        and m.brand_id = auth_brand_id()
    )
  );

-- RLS gates rows; these grants gate the table itself.
grant select, insert, update, delete on models, interest_entries to authenticated;
