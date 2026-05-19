-- Local seed data. Runs after migrations on `supabase db reset`.
-- Safe to re-run: uses ON CONFLICT DO NOTHING for natural keys.

insert into brands (name) values
  ('Panerai'),
  ('Hublot'),
  ('Tag Heuer')
on conflict (name) do nothing;

insert into stores (name, address) values
  ('Panerai Boutique - BGC',         null),
  ('Hublot Boutique - Greenbelt 5',  null),
  ('Tag Heuer Boutique - Solarie',   null),
  ('Tag Heuer Boutique - BGC',       null),
  ('Tag Heuer Boutique - Podium',    null)
on conflict (name) do nothing;

-- Sample model references per brand. Replace with the real catalog as needed.
insert into models (brand_id, reference, name)
select b.id, m.reference, m.name
from (
  values
    ('Panerai',   'PAM00005',        'Luminor Marina 44mm'),
    ('Panerai',   'PAM00111',        'Luminor Marina Logo'),
    ('Panerai',   'PAM00382',        'Radiomir 1940 Bronzo'),
    ('Panerai',   'PAM00578',        'Luminor Marina 1950 3 Days'),
    ('Hublot',    '411.NX.1170.RX',  'Big Bang Unico Titanium'),
    ('Hublot',    '525.OS.0117.RX',  'Classic Fusion Chronograph'),
    ('Hublot',    '331.SX.1170.RX',  'Big Bang 41mm Steel'),
    ('Tag Heuer', 'CBN2010',         'Carrera Calibre Heuer 02 Chronograph'),
    ('Tag Heuer', 'WAZ1112',         'Aquaracer Calibre 5'),
    ('Tag Heuer', 'CV2A1Q',          'Carrera Calibre 16')
) as m(brand_name, reference, name)
join brands b on b.name = m.brand_name
on conflict (brand_id, reference) do nothing;
