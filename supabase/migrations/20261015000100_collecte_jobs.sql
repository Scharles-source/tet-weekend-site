-- Jobs de collecte manuels (page /admin → runner local).
-- Aucune lecture publique. Runner = service_role en local uniquement (jamais sur Vercel).
-- Appliquer manuellement dans le SQL Editor Supabase.

-- ───────────────────────────── profiles (admin) ─────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Un utilisateur lit / met à jour uniquement sa propre ligne (pas is_admin côté client pour les updates sensibles).
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

-- Création auto du profil à l'inscription (is_admin reste false jusqu'à marquage manuel).
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

-- Helper RLS : l'appelant est-il admin ?
create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.est_admin() from public;
grant execute on function public.est_admin() to authenticated;

-- ───────────────────────────── collecte_jobs ─────────────────────────────
create table if not exists public.collecte_jobs (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null,
  action       text not null check (action in ('sites', 'maps', 'ocr', 'export', 'etat')),
  params       jsonb not null default '{}'::jsonb,
  statut       text not null default 'en_attente'
                 check (statut in (
                   'en_attente',
                   'en_cours',
                   'en_attente_action_humaine',
                   'termine',
                   'erreur'
                 )),
  log          text not null default '',
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  finished_at  timestamptz
);

create index if not exists collecte_jobs_statut_created_idx
  on public.collecte_jobs (statut, created_at);

alter table public.collecte_jobs enable row level security;

drop policy if exists collecte_jobs_admin_select on public.collecte_jobs;
create policy collecte_jobs_admin_select on public.collecte_jobs
  for select to authenticated
  using (public.est_admin());

drop policy if exists collecte_jobs_admin_insert on public.collecte_jobs;
create policy collecte_jobs_admin_insert on public.collecte_jobs
  for insert to authenticated
  with check (public.est_admin());

-- Pas d'update / delete pour le rôle authenticated : seuls le runner (service_role) met à jour.

grant select, insert on public.collecte_jobs to authenticated;
revoke update, delete on public.collecte_jobs from authenticated;
revoke all on public.collecte_jobs from anon;

-- ───────────────────────────── collecte_etat ─────────────────────────────
create table if not exists public.collecte_etat (
  slug            text primary key,
  etat            text not null default 'pas_commence'
                    check (etat in (
                      'pas_commence',
                      'image_recue',
                      'extraction_proposee',
                      'verifie',
                      'publie'
                    )),
  dernier_job_id  uuid references public.collecte_jobs (id) on delete set null,
  mis_a_jour_le   timestamptz not null default now()
);

alter table public.collecte_etat enable row level security;

drop policy if exists collecte_etat_admin_select on public.collecte_etat;
create policy collecte_etat_admin_select on public.collecte_etat
  for select to authenticated
  using (public.est_admin());

grant select on public.collecte_etat to authenticated;
revoke insert, update, delete on public.collecte_etat from authenticated;
revoke all on public.collecte_etat from anon;

-- Amorce : une ligne par restaurant connu (amorce 24 + test E2E).
insert into public.collecte_etat (slug, etat) values
  ('portofino-ristorante-italiano', 'pas_commence'),
  ('magdoos', 'pas_commence'),
  ('cafe36-resto-hotel-la-lorraine', 'pas_commence'),
  ('kay-bilolo', 'pas_commence'),
  ('karibe-hotel-la-brasserie', 'pas_commence'),
  ('kinam-hotel-restaurant', 'pas_commence'),
  ('pistachio-cafe-bistro', 'pas_commence'),
  ('papaye', 'pas_commence'),
  ('la-reserve', 'pas_commence'),
  ('smoke-house-barbecue', 'pas_commence'),
  ('pizza-garden', 'pas_commence'),
  ('coin-des-artistes-vivano', 'pas_commence'),
  ('rootz-food-art-music', 'pas_commence'),
  ('gecko-lounge-bar', 'pas_commence'),
  ('timeout-sports-bar-grill', 'pas_commence'),
  ('le-poulet-d-or', 'pas_commence'),
  ('green-bar', 'pas_commence'),
  ('jojo-restaurant-evergreen', 'pas_commence'),
  ('point-chaud', 'pas_commence'),
  ('flame-lounge-bar-grill', 'pas_commence'),
  ('kokoriko-breakfast-lunch', 'pas_commence'),
  ('5-coins', 'pas_commence'),
  ('kokoye-bar-grill', 'pas_commence'),
  ('mr-frosty', 'pas_commence'),
  ('test-collecte-menu', 'pas_commence')
on conflict (slug) do nothing;

-- ───────────────────────────── collecte_runner ─────────────────────────────
create table if not exists public.collecte_runner (
  id                  integer primary key check (id = 1),
  dernier_heartbeat   timestamptz,
  version             text
);

insert into public.collecte_runner (id, dernier_heartbeat, version)
values (1, null, null)
on conflict (id) do nothing;

alter table public.collecte_runner enable row level security;

drop policy if exists collecte_runner_admin_select on public.collecte_runner;
create policy collecte_runner_admin_select on public.collecte_runner
  for select to authenticated
  using (public.est_admin());

grant select on public.collecte_runner to authenticated;
revoke insert, update, delete on public.collecte_runner from authenticated;
revoke all on public.collecte_runner from anon;

-- profiles : pas d'accès anon
grant select on public.profiles to authenticated;
revoke all on public.profiles from anon;

comment on table public.collecte_jobs is
  'Jobs créés par /admin. Exécutés uniquement par le runner local (service_role). Pas d''import ni de publication.';
comment on table public.collecte_etat is
  'État de collecte par restaurant, mis à jour par le runner local.';
comment on table public.collecte_runner is
  'Heartbeat du runner local. Une seule ligne (id=1).';
