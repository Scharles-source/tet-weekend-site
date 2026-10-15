-- Tèt Weekend — MVP « Menus & Budgets »
-- Schéma : restaurants, menu_items, settings + RLS (lecture publique restreinte, aucune écriture publique).

create extension if not exists pgcrypto;

-- ───────────────────────────── restaurants ─────────────────────────────
create table if not exists public.restaurants (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom                   text not null,
  -- Zone(s) de recherche : Pétion-Ville et/ou Delmas (une chaîne peut couvrir les deux).
  zones                 text[] not null
                          check (cardinality(zones) >= 1 and zones <@ array['Pétion-Ville', 'Delmas']::text[]),
  -- Quartier précis en texte libre, ex. « Delmas 75 », « Pétion-Ville (Place Boyer) ».
  quartier              text,
  adresse               text,
  point_repere          text,
  latitude              double precision check (latitude between -90 and 90),
  longitude             double precision check (longitude between -180 and 180),
  whatsapp              text,
  telephone             text,
  instagram             text,
  horaires              text,
  jours_fermeture       text,
  heure_limite_cuisine  text,
  type_cuisine          text,
  ambiance              text,
  devise                text check (devise in ('HTG', 'USD')),
  -- Taux appliqué par le restaurant, en HTG pour 1 USD. Null = taux global (settings.taux_htg_usd).
  taux_htg_usd          numeric(10, 4) check (taux_htg_usd > 0),
  taxe_pct              numeric(5, 2) check (taxe_pct between 0 and 100),
  taxe_incluse          boolean,
  service_pct           numeric(5, 2) check (service_pct between 0 and 100),
  service_inclus        boolean,
  -- Null = non renseigné (jamais « non » par défaut).
  parking_garde         boolean,
  groupe_electrogene    boolean,
  climatisation         boolean,
  terrasse              boolean,
  modes_paiement        text[],
  -- Uniquement avec l'accord écrit du restaurant.
  photo_carte_url       text,
  date_dernier_releve   date,
  releve_par            text,
  statut                text not null default 'brouillon' check (statut in ('brouillon', 'publie', 'retire')),
  retrait_demande_le    date,
  motif_retrait         text,
  -- Données d'amorce / suivi interne (non exposées au public, voir grants plus bas).
  note_google           numeric(2, 1),
  avis_google           integer,
  avis_google_approx    boolean not null default false,
  rang_amorce           integer,
  notes_internes        text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists restaurants_statut_idx on public.restaurants (statut);

-- ───────────────────────────── menu_items ─────────────────────────────
create table if not exists public.menu_items (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants (id) on delete cascade,
  categorie      text not null check (categorie in ('Entrées', 'Plats', 'Desserts', 'Boissons', 'Cocktails')),
  nom            text not null,
  description    text,
  prix           numeric(12, 2) not null check (prix >= 0),
  devise         text not null check (devise in ('HTG', 'USD')),
  disponible     boolean not null default true,
  ordre          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (restaurant_id, categorie, nom)
);

create index if not exists menu_items_restaurant_idx on public.menu_items (restaurant_id);

-- ───────────────────────────── settings ─────────────────────────────
create table if not exists public.settings (
  cle          text primary key,
  valeur       text,
  description  text,
  updated_at   timestamptz not null default now()
);

-- ───────────────────────────── updated_at ─────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists restaurants_updated_at on public.restaurants;
create trigger restaurants_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();

drop trigger if exists menu_items_updated_at on public.menu_items;
create trigger menu_items_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ───────────────────────────── Droits + RLS ─────────────────────────────
alter table public.restaurants enable row level security;
alter table public.menu_items  enable row level security;
alter table public.settings    enable row level security;

-- Aucune écriture depuis le client public (anon / authenticated).
revoke all on public.restaurants from anon, authenticated;
revoke all on public.menu_items  from anon, authenticated;
revoke all on public.settings    from anon, authenticated;

-- Lecture publique : uniquement les colonnes utiles à l'affichage (pas les notes internes ni le motif de retrait).
grant select (
  id, slug, nom, zones, quartier, adresse, point_repere, latitude, longitude,
  whatsapp, telephone, instagram, horaires, jours_fermeture, heure_limite_cuisine,
  type_cuisine, ambiance, devise, taux_htg_usd, taxe_pct, taxe_incluse, service_pct, service_inclus,
  parking_garde, groupe_electrogene, climatisation, terrasse, modes_paiement,
  photo_carte_url, date_dernier_releve, statut
) on public.restaurants to anon, authenticated;

grant select (
  id, restaurant_id, categorie, nom, description, prix, devise, disponible, ordre
) on public.menu_items to anon, authenticated;

grant select (cle, valeur) on public.settings to anon, authenticated;

drop policy if exists restaurants_lecture_publique on public.restaurants;
create policy restaurants_lecture_publique on public.restaurants
  for select to anon, authenticated
  using (statut = 'publie');

drop policy if exists menu_items_lecture_publique on public.menu_items;
create policy menu_items_lecture_publique on public.menu_items
  for select to anon, authenticated
  using (exists (
    select 1 from public.restaurants r
    where r.id = menu_items.restaurant_id and r.statut = 'publie'
  ));

drop policy if exists settings_lecture_publique on public.settings;
create policy settings_lecture_publique on public.settings
  for select to anon, authenticated
  using (cle in ('taux_htg_usd', 'contact_email', 'contact_whatsapp'));

-- ───────────────────────────── Réglages par défaut ─────────────────────────────
-- Valeurs volontairement vides / placeholder : à remplacer par Smith. Ne jamais inventer un taux réel.
insert into public.settings (cle, valeur, description) values
  ('taux_htg_usd', '0', 'PLACEHOLDER — taux global HTG pour 1 USD, à remplacer par Smith. 0 = non renseigné (conversions désactivées).'),
  ('contact_email', '', 'À fournir par Smith — adresse de contact pour les demandes de correction / retrait de menu.'),
  ('contact_whatsapp', '', 'À fournir par Smith — numéro WhatsApp (format international, ex. 509XXXXXXXX) pour les demandes de correction / retrait.')
on conflict (cle) do nothing;
