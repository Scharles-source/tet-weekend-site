-- Statistiques du site : visites, présence « en ligne » et actions (flyer, agenda).
-- Anonyme : un identifiant aléatoire par navigateur, sans cookie ni compte. Le pays et la ville viennent
-- de l'hébergeur (approximatifs). Les visiteurs n'ont aucun accès direct : tout passe par des fonctions.
-- Lecture réservée à l'admin (statistiques_admin). Les anciennes données sont effacées après 180 jours.

create table if not exists public.site_visits (
  id         bigint generated always as identity primary key,
  visiteur   uuid not null,
  chemin     text not null check (length(chemin) <= 200),
  event_id   uuid references public.events (id) on delete set null,
  source     text not null default 'direct',
  pays       text check (pays is null or length(pays) = 2),
  ville      text check (ville is null or length(ville) <= 80),
  appareil   text not null default 'mobile' check (appareil in ('mobile', 'ordinateur')),
  created_at timestamptz not null default now()
);
create index if not exists site_visits_created_idx on public.site_visits (created_at desc);
create index if not exists site_visits_event_idx on public.site_visits (event_id) where event_id is not null;

create table if not exists public.site_actions (
  id         bigint generated always as identity primary key,
  visiteur   uuid not null,
  type       text not null check (type in ('agenda', 'flyer')),
  event_id   uuid not null references public.events (id) on delete cascade,
  jour       date not null default current_date,
  created_at timestamptz not null default now(),
  unique (visiteur, type, event_id, jour)
);
create index if not exists site_actions_created_idx on public.site_actions (created_at desc);

create table if not exists public.site_presence (
  visiteur uuid primary key,
  vu_a     timestamptz not null default now(),
  appareil text not null default 'mobile' check (appareil in ('mobile', 'ordinateur'))
);
create index if not exists site_presence_vu_idx on public.site_presence (vu_a desc);

alter table public.site_visits enable row level security;
alter table public.site_actions enable row level security;
alter table public.site_presence enable row level security;
-- Volontairement aucune policy : aucune lecture ni écriture directe avec la clé publique.

create or replace function public.enregistrer_visite(
  p_visiteur uuid,
  p_chemin text,
  p_slug text,
  p_source text,
  p_pays text,
  p_ville text,
  p_appareil text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event uuid;
  v_source text;
  v_appareil text;
begin
  if p_visiteur is null or p_chemin is null or left(p_chemin, 1) <> '/' or length(p_chemin) > 200 then
    return;
  end if;
  v_source := case
    when p_source in ('instagram', 'whatsapp', 'facebook', 'google', 'tiktok', 'x', 'youtube', 'direct') then p_source
    else 'autre'
  end;
  v_appareil := case when p_appareil = 'ordinateur' then 'ordinateur' else 'mobile' end;
  if p_slug is not null then
    select e.id into v_event from public.events e where e.slug = p_slug and e.statut = 'publie' limit 1;
  end if;

  insert into public.site_visits (visiteur, chemin, event_id, source, pays, ville, appareil)
  values (
    p_visiteur,
    p_chemin,
    v_event,
    v_source,
    case when p_pays ~ '^[A-Za-z]{2}$' then upper(p_pays) end,
    nullif(left(p_ville, 80), ''),
    v_appareil
  );

  insert into public.site_presence (visiteur, vu_a, appareil)
  values (p_visiteur, now(), v_appareil)
  on conflict (visiteur) do update set vu_a = now(), appareil = excluded.appareil;

  -- Nettoyage occasionnel (environ une visite sur cent).
  if random() < 0.01 then
    delete from public.site_visits where created_at < now() - interval '180 days';
    delete from public.site_actions where created_at < now() - interval '180 days';
    delete from public.site_presence where vu_a < now() - interval '1 day';
  end if;
end;
$$;

create or replace function public.signaler_presence(p_visiteur uuid, p_appareil text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visiteur is null then
    return;
  end if;
  insert into public.site_presence (visiteur, vu_a, appareil)
  values (p_visiteur, now(), case when p_appareil = 'ordinateur' then 'ordinateur' else 'mobile' end)
  on conflict (visiteur) do update set vu_a = now(), appareil = excluded.appareil;
end;
$$;

create or replace function public.enregistrer_action(p_visiteur uuid, p_type text, p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event uuid;
begin
  if p_visiteur is null or p_type not in ('agenda', 'flyer') or p_slug is null then
    return;
  end if;
  select e.id into v_event from public.events e where e.slug = p_slug and e.statut = 'publie' limit 1;
  if v_event is null then
    return;
  end if;
  insert into public.site_actions (visiteur, type, event_id) values (p_visiteur, p_type, v_event)
  on conflict do nothing;
end;
$$;

-- Lecture admin : tout le tableau de bord en un seul appel. Périodes : aujourdhui, 7j, 30j, tout.
-- Les jours sont calculés à l'heure d'Haïti.
create or replace function public.statistiques_admin(p_periode text default 'aujourdhui')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tz constant text := 'America/Port-au-Prince';
  aujourdhui date := (now() at time zone tz)::date;
  debut_jour timestamptz := aujourdhui::timestamp at time zone tz;
  hier_debut timestamptz := (aujourdhui - 1)::timestamp at time zone tz;
  hier_fin timestamptz;
  debut timestamptz;
  nb_jours int;
  resultat jsonb;
begin
  if not public.est_admin() then
    raise exception 'Accès réservé' using errcode = '42501';
  end if;

  hier_fin := hier_debut + (now() - debut_jour);
  debut := case p_periode
    when '7j' then (aujourdhui - 6)::timestamp at time zone tz
    when '30j' then (aujourdhui - 29)::timestamp at time zone tz
    when 'tout' then '-infinity'::timestamptz
    else debut_jour
  end;
  nb_jours := case p_periode when '7j' then 7 else 30 end;

  select jsonb_build_object(
    'periode', case when p_periode in ('7j', '30j', 'tout') then p_periode else 'aujourdhui' end,
    'genere_a', now(),
    'heure_actuelle', extract(hour from now() at time zone tz)::int,
    'en_ligne', jsonb_build_object(
      'total', (select count(*) from public.site_presence where vu_a > now() - interval '5 minutes'),
      'mobile', (select count(*) from public.site_presence where vu_a > now() - interval '5 minutes' and appareil = 'mobile'),
      'ordinateur', (select count(*) from public.site_presence where vu_a > now() - interval '5 minutes' and appareil = 'ordinateur')
    ),
    'visiteurs', (select count(distinct visiteur) from public.site_visits where created_at >= debut),
    'pages_vues', (select count(*) from public.site_visits where created_at >= debut),
    'visiteurs_hier_meme_heure', (select count(distinct visiteur) from public.site_visits where created_at >= hier_debut and created_at < hier_fin),
    'pages_vues_hier_meme_heure', (select count(*) from public.site_visits where created_at >= hier_debut and created_at < hier_fin),
    'jy_vais', (select count(*) from public.event_interests where created_at >= debut),
    'jy_vais_hier_meme_heure', (select count(*) from public.event_interests where created_at >= hier_debut and created_at < hier_fin),
    'actions', jsonb_build_object(
      'agenda', (select count(*) from public.site_actions where type = 'agenda' and created_at >= debut),
      'flyer', (select count(*) from public.site_actions where type = 'flyer' and created_at >= debut)
    ),
    'serie_type', case when p_periode = 'aujourdhui' or p_periode is null or p_periode not in ('7j', '30j', 'tout') then 'heure' else 'jour' end,
    'serie', case
      when p_periode in ('7j', '30j', 'tout') then (
        select coalesce(jsonb_agg(jsonb_build_object('x', to_char(aujourdhui - (nb_jours - 1) + g.k, 'DD/MM'), 'n', coalesce(t.n, 0)) order by g.k), '[]'::jsonb)
        from generate_series(0, nb_jours - 1) as g(k)
        left join (
          select (created_at at time zone tz)::date as jour, count(distinct visiteur) as n
          from public.site_visits
          where created_at >= (aujourdhui - (nb_jours - 1))::timestamp at time zone tz
          group by 1
        ) t on t.jour = aujourdhui - (nb_jours - 1) + g.k
      )
      else (
        select coalesce(jsonb_agg(jsonb_build_object('x', h::text, 'n', coalesce(t.n, 0)) order by h), '[]'::jsonb)
        from generate_series(0, 23) as g(h)
        left join (
          select extract(hour from created_at at time zone tz)::int as heure, count(distinct visiteur) as n
          from public.site_visits
          where created_at >= debut_jour
          group by 1
        ) t on t.heure = g.h
      )
    end,
    'serie_precedente', case
      when p_periode in ('7j', '30j', 'tout') then null
      else (
        select coalesce(jsonb_agg(coalesce(t.n, 0) order by h), '[]'::jsonb)
        from generate_series(0, 23) as g(h)
        left join (
          select extract(hour from created_at at time zone tz)::int as heure, count(distinct visiteur) as n
          from public.site_visits
          where created_at >= hier_debut and created_at < debut_jour
          group by 1
        ) t on t.heure = g.h
      )
    end,
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('nom', source, 'n', n) order by n desc), '[]'::jsonb)
      from (select source, count(distinct visiteur) as n from public.site_visits where created_at >= debut group by 1) s
    ),
    'pays', (
      select coalesce(jsonb_agg(jsonb_build_object('code', code, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select coalesce(pays, '??') as code, count(distinct visiteur) as n
        from public.site_visits where created_at >= debut group by 1 order by 2 desc limit 8
      ) p
    ),
    'villes', (
      select coalesce(jsonb_agg(jsonb_build_object('nom', ville, 'pays', pays, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select ville, max(pays) as pays, count(distinct visiteur) as n
        from public.site_visits where created_at >= debut and ville is not null group by ville order by 3 desc limit 8
      ) v
    ),
    'localisation', jsonb_build_object(
      'haiti', (select count(distinct visiteur) from public.site_visits where created_at >= debut and pays = 'HT'),
      'diaspora', (select count(distinct visiteur) from public.site_visits where created_at >= debut and pays is not null and pays <> 'HT'),
      'inconnu', (select count(distinct visiteur) from public.site_visits where created_at >= debut and pays is null)
    ),
    'appareils', jsonb_build_object(
      'mobile', (select count(distinct visiteur) from public.site_visits where created_at >= debut and appareil = 'mobile'),
      'ordinateur', (select count(distinct visiteur) from public.site_visits where created_at >= debut and appareil = 'ordinateur')
    ),
    'evenements', (
      select coalesce(jsonb_agg(t.ligne order by t.vues desc), '[]'::jsonb)
      from (
        select x.vues,
               jsonb_build_object(
                 'id', e.id, 'titre', e.titre, 'ville', e.ville, 'date_debut', e.date_debut, 'statut', e.statut,
                 'vues', x.vues, 'flyers', coalesce(a.flyers, 0), 'agendas', coalesce(a.agendas, 0), 'interets', coalesce(i.n, 0)
               ) as ligne
        from (
          select event_id, count(*) as vues from public.site_visits
          where created_at >= debut and event_id is not null group by 1
        ) x
        join public.events e on e.id = x.event_id
        left join (
          select event_id,
                 count(*) filter (where type = 'flyer') as flyers,
                 count(*) filter (where type = 'agenda') as agendas
          from public.site_actions where created_at >= debut group by 1
        ) a on a.event_id = e.id
        left join (
          select event_id, count(*) as n from public.event_interests where created_at >= debut group by 1
        ) i on i.event_id = e.id
        order by x.vues desc
        limit 8
      ) t
    )
  ) into resultat;

  return resultat;
end;
$$;

revoke all on function public.enregistrer_visite(uuid, text, text, text, text, text, text) from public;
revoke all on function public.signaler_presence(uuid, text) from public;
revoke all on function public.enregistrer_action(uuid, text, text) from public;
revoke all on function public.statistiques_admin(text) from public;
grant execute on function public.enregistrer_visite(uuid, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.signaler_presence(uuid, text) to anon, authenticated;
grant execute on function public.enregistrer_action(uuid, text, text) to anon, authenticated;
grant execute on function public.statistiques_admin(text) to authenticated;
