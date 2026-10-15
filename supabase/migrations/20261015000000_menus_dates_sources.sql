-- Menus datés et traçabilité des prix (fouille Instagram du 15 oct. 2026).
-- Nouvelles catégories : Menu du jour, Menu de la semaine, Spécial, Carte, Promotions (les catégories de carte existantes restent valides).
-- Chaque article peut porter sa source, sa date de relevé et sa période de validité.

alter table public.menu_items drop constraint if exists menu_items_categorie_check;
alter table public.menu_items add constraint menu_items_categorie_check check (categorie in (
  'Menu du jour', 'Menu de la semaine', 'Spécial', 'Carte',
  'Entrées', 'Plats', 'Desserts', 'Boissons', 'Cocktails',
  'Promotions'
));

alter table public.menu_items
  add column if not exists source_url  text,
  -- Date de la publication / du relevé d'où vient le prix.
  add column if not exists date_releve date,
  -- Période annoncée par le restaurant (ex. menu de la semaine du 12 au 18 oct.). Null = non précisée.
  add column if not exists valide_du   date,
  add column if not exists valide_au   date,
  -- Prix relevé mais validité actuelle non confirmée.
  add column if not exists a_verifier  boolean not null default false;

alter table public.menu_items drop constraint if exists menu_items_periode_check;
alter table public.menu_items add constraint menu_items_periode_check
  check (valide_du is null or valide_au is null or valide_du <= valide_au);

grant select (source_url, date_releve, valide_du, valide_au, a_verifier) on public.menu_items to anon, authenticated;
