-- Admin /admin : publication et menus, sans service_role.
-- Statuts : brouillon | publie | retire (sans accent).
-- N'altère pas les politiques de lecture publique existantes.

-- Colonnes de traçabilité (déjà prévues par 20261015000000 ; sans effet si présentes).
alter table public.menu_items
  add column if not exists source_url text,
  add column if not exists date_releve date,
  add column if not exists valide_du date,
  add column if not exists valide_au date,
  add column if not exists a_verifier boolean not null default false;

alter table public.menu_items drop constraint if exists menu_items_categorie_check;
alter table public.menu_items add constraint menu_items_categorie_check check (categorie in (
  'Menu du jour', 'Menu de la semaine', 'Spécial', 'Carte',
  'Entrées', 'Plats', 'Desserts', 'Boissons', 'Cocktails',
  'Promotions'
));

alter table public.menu_items drop constraint if exists menu_items_periode_check;
alter table public.menu_items add constraint menu_items_periode_check
  check (valide_du is null or valide_au is null or valide_du <= valide_au);

grant select (source_url, date_releve, valide_du, valide_au, a_verifier)
  on public.menu_items to anon, authenticated;

-- ───────────────────────────── profiles ─────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

grant select on public.profiles to authenticated;
revoke all on public.profiles from anon;

create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

revoke all on function public.est_admin() from public, anon;
grant execute on function public.est_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profils pour les comptes déjà créés.
insert into public.profiles (id, email, is_admin)
select id, email, false from auth.users
on conflict (id) do update set email = excluded.email;

-- Compte Smith (auteur du dépôt).
update public.profiles
set is_admin = true
where email = 'smithcharles8484@gmail.com';

-- ───────────────────────────── écritures admin ─────────────────────────────
grant select (motif_retrait, retrait_demande_le) on public.restaurants to authenticated;
grant update (statut, motif_retrait, retrait_demande_le) on public.restaurants to authenticated;

grant insert, update, delete on public.menu_items to authenticated;

drop policy if exists restaurants_admin_select on public.restaurants;
create policy restaurants_admin_select on public.restaurants
  for select to authenticated
  using (public.est_admin());

drop policy if exists restaurants_admin_update on public.restaurants;
create policy restaurants_admin_update on public.restaurants
  for update to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists menu_items_admin_select on public.menu_items;
create policy menu_items_admin_select on public.menu_items
  for select to authenticated
  using (public.est_admin());

drop policy if exists menu_items_admin_insert on public.menu_items;
create policy menu_items_admin_insert on public.menu_items
  for insert to authenticated
  with check (public.est_admin());

drop policy if exists menu_items_admin_update on public.menu_items;
create policy menu_items_admin_update on public.menu_items
  for update to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists menu_items_admin_delete on public.menu_items;
create policy menu_items_admin_delete on public.menu_items
  for delete to authenticated
  using (public.est_admin());
