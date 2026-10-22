-- Listing d'événements haïtiens (plan v1, 22 oct. 2026).
-- Les tables restaurants / menu_items restent en place, mais le site ne les lit plus.
-- Statuts : brouillon | publie | retire (sans accent).
-- Les 24 restaurants d'amorce deviennent des lieux en brouillon, sans description inventée.

create extension if not exists pgcrypto;

-- ───────────────────────────── venues ─────────────────────────────
create table if not exists public.venues (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom                 text not null,
  ville               text,
  pays                text,
  adresse             text,
  type                text check (type is null or type in ('bar', 'club', 'restaurant', 'salle')),
  description         text,
  instagram           text,
  facebook            text,
  site_web            text,
  statut              text not null default 'brouillon' check (statut in ('brouillon', 'publie', 'retire')),
  retrait_demande_le  date,
  motif_retrait       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists venues_statut_idx on public.venues (statut);
create index if not exists venues_ville_idx on public.venues (ville);

-- ───────────────────────────── artists ─────────────────────────────
create table if not exists public.artists (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom                 text not null,
  type                text check (type is null or type in ('DJ', 'groupe', 'chanteur')),
  ville_base          text,
  bio                 text,
  instagram           text,
  facebook            text,
  site_web            text,
  statut              text not null default 'brouillon' check (statut in ('brouillon', 'publie', 'retire')),
  retrait_demande_le  date,
  motif_retrait       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists artists_statut_idx on public.artists (statut);

-- ───────────────────────────── events ─────────────────────────────
create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titre               text not null,
  date_debut          timestamptz not null,
  date_fin            timestamptz,
  venue_id            uuid references public.venues (id) on delete set null,
  ville               text,
  description         text,
  prix                text,
  source              text check (source is null or source in ('instagram', 'facebook', 'eventbrite', 'manuel')),
  source_url          text,
  categorie           text check (categorie is null or categorie in ('bals', 'concerts', 'soirees-kompa', 'festivals')),
  fuseau              text not null default 'America/Port-au-Prince',
  a_verifier          boolean not null default false,
  statut              text not null default 'brouillon' check (statut in ('brouillon', 'publie', 'retire')),
  retrait_demande_le  date,
  motif_retrait       text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (date_fin is null or date_fin >= date_debut)
);

create index if not exists events_statut_date_idx on public.events (statut, date_debut);
create index if not exists events_venue_idx on public.events (venue_id);
create index if not exists events_ville_idx on public.events (ville);

-- ───────────────────────────── event_artists ─────────────────────────────
create table if not exists public.event_artists (
  event_id   uuid not null references public.events (id) on delete cascade,
  artist_id  uuid not null references public.artists (id) on delete cascade,
  primary key (event_id, artist_id)
);

-- ───────────────────────────── watch_accounts ─────────────────────────────
-- La veille (phase 2) lira cette liste. Aucun scan dans cette migration.
create table if not exists public.watch_accounts (
  id          uuid primary key default gen_random_uuid(),
  plateforme  text not null check (plateforme in ('instagram', 'facebook', 'eventbrite')),
  handle      text,
  url         text,
  type        text not null check (type in ('lieu', 'artiste', 'promoteur')),
  actif       boolean not null default true,
  venue_id    uuid references public.venues (id) on delete set null,
  artist_id   uuid references public.artists (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ───────────────────────────── updated_at ─────────────────────────────
drop trigger if exists venues_updated_at on public.venues;
create trigger venues_updated_at before update on public.venues
  for each row execute function public.set_updated_at();

drop trigger if exists artists_updated_at on public.artists;
create trigger artists_updated_at before update on public.artists
  for each row execute function public.set_updated_at();

drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

-- ───────────────────────────── Grants ─────────────────────────────
-- anon : colonnes d'affichage seulement. authenticated : CRUD (RLS limite aux admins).
-- service_role : CRUD complet, dans la même migration que la création des tables.

revoke all on public.venues from anon, authenticated;
revoke all on public.artists from anon, authenticated;
revoke all on public.events from anon, authenticated;
revoke all on public.event_artists from anon, authenticated;
revoke all on public.watch_accounts from anon, authenticated;

grant select (
  id, slug, nom, ville, pays, adresse, type, description, instagram, facebook, site_web
) on public.venues to anon;

grant select (
  id, slug, nom, type, ville_base, bio, instagram, facebook, site_web
) on public.artists to anon;

grant select (
  id, slug, titre, date_debut, date_fin, venue_id, ville, description, prix,
  source, source_url, categorie, fuseau
) on public.events to anon;

grant select (event_id, artist_id) on public.event_artists to anon;

grant select, insert, update, delete on public.venues to authenticated;
grant select, insert, update, delete on public.artists to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_artists to authenticated;
grant select, insert, update, delete on public.watch_accounts to authenticated;

grant all privileges on public.venues to service_role;
grant all privileges on public.artists to service_role;
grant all privileges on public.events to service_role;
grant all privileges on public.event_artists to service_role;
grant all privileges on public.watch_accounts to service_role;

-- ───────────────────────────── RLS ─────────────────────────────
alter table public.venues enable row level security;
alter table public.artists enable row level security;
alter table public.events enable row level security;
alter table public.event_artists enable row level security;
alter table public.watch_accounts enable row level security;

drop policy if exists venues_lecture_publique on public.venues;
create policy venues_lecture_publique on public.venues
  for select to anon, authenticated
  using (statut = 'publie');

drop policy if exists venues_admin_all on public.venues;
create policy venues_admin_all on public.venues
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists artists_lecture_publique on public.artists;
create policy artists_lecture_publique on public.artists
  for select to anon, authenticated
  using (statut = 'publie');

drop policy if exists artists_admin_all on public.artists;
create policy artists_admin_all on public.artists
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists events_lecture_publique on public.events;
create policy events_lecture_publique on public.events
  for select to anon, authenticated
  using (statut = 'publie');

drop policy if exists events_admin_all on public.events;
create policy events_admin_all on public.events
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists event_artists_lecture_publique on public.event_artists;
create policy event_artists_lecture_publique on public.event_artists
  for select to anon, authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_artists.event_id and e.statut = 'publie'
  ));

drop policy if exists event_artists_admin_all on public.event_artists;
create policy event_artists_admin_all on public.event_artists
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

drop policy if exists watch_accounts_admin_all on public.watch_accounts;
create policy watch_accounts_admin_all on public.watch_accounts
  for all to authenticated
  using (public.est_admin())
  with check (public.est_admin());

-- ───────────────────────────── Lieux depuis les restaurants ─────────────────────────────
insert into public.venues (slug, nom, ville, pays, adresse, instagram, statut)
select
  r.slug,
  r.nom,
  case when cardinality(r.zones) = 1 then r.zones[1] else null end,
  'Haïti',
  r.quartier,
  r.instagram,
  'brouillon'
from public.restaurants r
on conflict (slug) do nothing;
