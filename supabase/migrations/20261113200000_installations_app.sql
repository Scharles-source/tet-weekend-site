-- Installations de la web app : une ligne par visiteur, type et jour (anonyme, sans compte).
--  - 'installation' : le navigateur signale que l'app vient d'être installée (Android, ordinateur).
--  - 'ouverture'    : l'app est ouverte depuis l'écran d'accueil (seul signal fiable sur iPhone).
-- Les visiteurs n'ont aucun accès direct aux tables ; la lecture est réservée à l'admin.

create table if not exists public.app_usage (
  id         bigint generated always as identity primary key,
  visiteur   uuid not null,
  type       text not null check (type in ('installation', 'ouverture')),
  plateforme text not null default 'autre' check (plateforme in ('android', 'ios', 'autre')),
  jour       date not null default current_date,
  created_at timestamptz not null default now(),
  unique (visiteur, type, jour)
);
create index if not exists app_usage_created_idx on public.app_usage (created_at desc);
alter table public.app_usage enable row level security;
-- Volontairement aucune policy : aucune lecture ni écriture directe avec la clé publique.

create or replace function public.enregistrer_app(p_visiteur uuid, p_type text, p_plateforme text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visiteur is null or p_type not in ('installation', 'ouverture') then
    return;
  end if;
  insert into public.app_usage (visiteur, type, plateforme)
  values (p_visiteur, p_type, case when p_plateforme in ('android', 'ios') then p_plateforme else 'autre' end)
  on conflict do nothing;
end;
$$;

-- Lecture admin. « installations » = visiteurs distincts ayant installé ou ouvert l'app (un iPhone n'envoie
-- pas d'événement d'installation : il est compté à sa première ouverture depuis l'écran d'accueil).
create or replace function public.installations_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tz constant text := 'America/Port-au-Prince';
  debut_jour timestamptz := ((now() at time zone tz)::date)::timestamp at time zone tz;
  debut_7j timestamptz := (((now() at time zone tz)::date) - 6)::timestamp at time zone tz;
  resultat jsonb;
begin
  if not public.est_admin() then
    raise exception 'Accès réservé' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'installations', (select count(distinct visiteur) from public.app_usage),
    'nouvelles_aujourdhui', (select count(*) from (select visiteur from public.app_usage group by visiteur having min(created_at) >= debut_jour) a),
    'nouvelles_7j', (select count(*) from (select visiteur from public.app_usage group by visiteur having min(created_at) >= debut_7j) a),
    'ouvertures_aujourdhui', (select count(distinct visiteur) from public.app_usage where type = 'ouverture' and created_at >= debut_jour),
    'android', (select count(distinct visiteur) from public.app_usage where plateforme = 'android'),
    'ios', (select count(distinct visiteur) from public.app_usage where plateforme = 'ios')
  ) into resultat;
  return resultat;
end;
$$;

revoke all on function public.enregistrer_app(uuid, text, text) from public;
revoke all on function public.installations_admin() from public;
grant execute on function public.enregistrer_app(uuid, text, text) to anon, authenticated;
grant execute on function public.installations_admin() to authenticated;
