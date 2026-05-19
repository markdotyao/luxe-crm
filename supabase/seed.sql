-- Local seed data. Runs after migrations on `supabase db reset`.
-- Safe to re-run: uses ON CONFLICT DO NOTHING for natural keys.

insert into brands (name, slug) values
  ('Panerai',   'panerai'),
  ('Hublot',    'hublot'),
  ('Tag Heuer', 'tag-heuer')
on conflict (name) do nothing;

insert into stores (name, address) values
  ('Panerai Boutique - BGC',         null),
  ('Hublot Boutique - Greenbelt 5',  null),
  ('Tag Heuer Boutique - Solarie',   null),
  ('Tag Heuer Boutique - BGC',       null),
  ('Tag Heuer Boutique - Podium',    null)
on conflict (name) do nothing;
