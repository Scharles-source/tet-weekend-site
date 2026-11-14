-- Statistiques : filtre robots, exclusion des appareils du propriétaire, visiteurs engagés.
-- - Le user-agent est désormais stocké avec chaque visite (colonne user_agent).
-- - Une visite dont le user-agent correspond à un robot connu (liste unique : ua_est_robot)
--   est marquée est_robot ; une visite d'un navigateur exclu (?exclure=1, transmis par le client)
--   est marquée est_exclu. Les lignes sont gardées, mais statistiques_admin ne compte que les
--   visiteurs ni robots ni exclus, et expose en plus : visiteurs_engages (≥ 2 pages vues ou
--   ≥ 1 action sur la période), robots_filtres et visiteurs_exclus.
-- - La présence (« en ligne ») porte les mêmes marques : un battement robot ou exclu est
--   enregistré mais ne compte pas dans le « en ligne ».
-- Les lignes déjà enregistrées ne sont pas reclassifiées (aucun user-agent stocké) :
-- le filtre vaut à partir de cette migration.

alter table public.site_visits
  add column if not exists user_agent text,
  add column if not exists est_robot boolean not null default false,
  add column if not exists est_exclu boolean not null default false;

alter table public.site_presence
  add column if not exists est_robot boolean not null default false,
  add column if not exists est_exclu boolean not null default false;

-- Liste unique des motifs de robots : sous-chaînes cherchées dans le user-agent en minuscules.
-- Un user-agent vide ou absent est traité comme un robot.
create or replace function public.ua_est_robot(p_ua text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when p_ua is null or btrim(p_ua) = '' then true
    else exists (
      select 1
      from unnest(array[
        'bot', 'crawl', 'spider', 'slurp', 'preview', 'headless',
        'facebookexternalhit', 'meta-externalagent', 'whatsapp',
        'curl', 'python-requests', 'python-urllib', 'go-http-client',
        'gptbot', 'claudebot', 'perplexitybot', 'ccbot', 'bytespider',
        'ahrefs', 'semrush', 'mj12', 'dotbot', 'dataforseo', 'blexbot',
        'petalbot', 'yandex', 'baiduspider', 'duckduckbot', 'amazonbot',
        'applebot', 'ia_archiver', 'lighthouse', 'pingdom', 'uptime',
        'w3c_validator', 'zgrab', 'masscan', 'nmap', 'libwww', 'okhttp',
        'axios', 'node-fetch', 'postman', 'insomnia'
      ]) as m(motif)
      where lower(p_ua) like '%' || m.motif || '%'
    )
  end;
$$;

revoke all on function public.ua_est_robot(text) from public;

-- Enregistrement d'une visite : stocke le user-agent, marque robot/exclu, présence marquée aussi.
drop function if exists public.enregistrer_visite(uuid, text, text, text, text, text, text);

create or replace function public.enregistrer_visite(
  p_visiteur uuid,
  p_chemin text,
  p_slug text,
  p_source text,
  p_pays text,
  p_ville text,
  p_appareil text,
  p_user_agent text default null,
  p_exclu boolean default false
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
  v_ua text := nullif(left(p_user_agent, 400), '');
  v_robot boolean;
  v_exclu boolean := coalesce(p_exclu, false);
begin
  if p_visiteur is null or p_chemin is null or left(p_chemin, 1) <> '/' or length(p_chemin) > 200 then
    return;
  end if;
  v_robot := public.ua_est_robot(v_ua);
  v_source := case
    when p_source in ('instagram', 'whatsapp', 'facebook', 'google', 'tiktok', 'x', 'youtube', 'direct') then p_source
    else 'autre'
  end;
  v_appareil := case when p_appareil = 'ordinateur' then 'ordinateur' else 'mobile' end;
  if p_slug is not null then
    select e.id into v_event from public.events e where e.slug = p_slug and e.statut = 'publie' limit 1;
  end if;

  insert into public.site_visits (visiteur, chemin, event_id, source, pays, ville, appareil, user_agent, est_robot, est_exclu)
  values (
    p_visiteur,
    p_chemin,
    v_event,
    v_source,
    case when p_pays ~ '^[A-Za-z]{2}$' then upper(p_pays) end,
    nullif(left(p_ville, 80), ''),
    v_appareil,
    v_ua,
    v_robot,
    v_exclu
  );

  insert into public.site_presence (visiteur, vu_a, appareil, est_robot, est_exclu)
  values (p_visiteur, now(), v_appareil, v_robot, v_exclu)
  on conflict (visiteur) do update
    set vu_a = now(),
        appareil = excluded.appareil,
        est_robot = site_presence.est_robot or excluded.est_robot,
        est_exclu = site_presence.est_exclu or excluded.est_exclu;

  -- Nettoyage occasionnel (environ une visite sur cent).
  if random() < 0.01 then
    delete from public.site_visits where created_at < now() - interval '180 days';
    delete from public.site_actions where created_at < now() - interval '180 days';
    delete from public.site_presence where vu_a < now() - interval '1 day';
  end if;
end;
$$;

-- Battement de présence : même marquage. Les marques sont collantes (un visiteur marqué
-- robot ou exclu le reste), et un battement sans user-agent transmis ne reclassifie pas.
drop function if exists public.signaler_presence(uuid, text);

create or replace function public.signaler_presence(
  p_visiteur uuid,
  p_appareil text,
  p_user_agent text default null,
  p_exclu boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_robot boolean := p_user_agent is not null and public.ua_est_robot(p_user_agent);
begin
  if p_visiteur is null then
    return;
  end if;
  insert into public.site_presence (visiteur, vu_a, appareil, est_robot, est_exclu)
  values (p_visiteur, now(), case when p_appareil = 'ordinateur' then 'ordinateur' else 'mobile' end, v_robot, coalesce(p_exclu, false))
  on conflict (visiteur) do update
    set vu_a = now(),
        appareil = excluded.appareil,
        est_robot = site_presence.est_robot or excluded.est_robot,
        est_exclu = site_presence.est_exclu or excluded.est_exclu;
end;
$$;

-- Lecture admin : mêmes champs qu'avant, calculés sur les visiteurs ni robots ni exclus,
-- plus visiteurs_engages, robots_filtres et visiteurs_exclus.
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
  v_robots uuid[];
  v_exclus uuid[];
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

  -- Visiteurs écartés de tous les comptages : marqués robot ou exclu sur la période.
  select coalesce(array_agg(distinct visiteur), '{}'::uuid[]) into v_robots
    from public.site_visits where created_at >= debut and est_robot;
  select coalesce(array_agg(distinct visiteur), '{}'::uuid[]) into v_exclus
    from public.site_visits where created_at >= debut and est_exclu;

  select jsonb_build_object(
    'periode', case when p_periode in ('7j', '30j', 'tout') then p_periode else 'aujourdhui' end,
    'genere_a', now(),
    'heure_actuelle', extract(hour from now() at time zone tz)::int,
    'en_ligne', jsonb_build_object(
      'total', (select count(*) from public.site_presence where vu_a > now() - interval '5 minutes' and not est_robot and not est_exclu),
      'mobile', (select count(*) from public.site_presence where vu_a > now() - interval '5 minutes' and appareil = 'mobile' and not est_robot and not est_exclu),
      'ordinateur', (select count(*) from public.site_presence where vu_a > now() - interval '5 minutes' and appareil = 'ordinateur' and not est_robot and not est_exclu)
    ),
    'visiteurs', (select count(distinct visiteur) from public.site_visits where created_at >= debut and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
    'visiteurs_engages', (
      select count(*) from (
        select v.visiteur
        from public.site_visits v
        where v.created_at >= debut and v.visiteur <> all(v_robots) and v.visiteur <> all(v_exclus)
        group by v.visiteur
        having count(*) >= 2
           or exists (select 1 from public.site_actions a where a.visiteur = v.visiteur and a.created_at >= debut)
      ) eng
    ),
    'robots_filtres', cardinality(v_robots),
    'visiteurs_exclus', cardinality(v_exclus),
    'pages_vues', (select count(*) from public.site_visits where created_at >= debut and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
    'visiteurs_hier_meme_heure', (select count(distinct visiteur) from public.site_visits where created_at >= hier_debut and created_at < hier_fin and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
    'pages_vues_hier_meme_heure', (select count(*) from public.site_visits where created_at >= hier_debut and created_at < hier_fin and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
    'jy_vais', (select count(*) from public.event_interests where created_at >= debut),
    'jy_vais_hier_meme_heure', (select count(*) from public.event_interests where created_at >= hier_debut and created_at < hier_fin),
    'actions', jsonb_build_object(
      'agenda', (select count(*) from public.site_actions where type = 'agenda' and created_at >= debut and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
      'flyer', (select count(*) from public.site_actions where type = 'flyer' and created_at >= debut and visiteur <> all(v_robots) and visiteur <> all(v_exclus))
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
            and visiteur <> all(v_robots) and visiteur <> all(v_exclus)
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
            and visiteur <> all(v_robots) and visiteur <> all(v_exclus)
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
            and visiteur <> all(v_robots) and visiteur <> all(v_exclus)
          group by 1
        ) t on t.heure = g.h
      )
    end,
    'sources', (
      select coalesce(jsonb_agg(jsonb_build_object('nom', source, 'n', n) order by n desc), '[]'::jsonb)
      from (select source, count(distinct visiteur) as n from public.site_visits where created_at >= debut and visiteur <> all(v_robots) and visiteur <> all(v_exclus) group by 1) s
    ),
    'pays', (
      select coalesce(jsonb_agg(jsonb_build_object('code', code, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select coalesce(pays, '??') as code, count(distinct visiteur) as n
        from public.site_visits where created_at >= debut and visiteur <> all(v_robots) and visiteur <> all(v_exclus) group by 1 order by 2 desc limit 8
      ) p
    ),
    'villes', (
      select coalesce(jsonb_agg(jsonb_build_object('nom', ville, 'pays', pays, 'n', n) order by n desc), '[]'::jsonb)
      from (
        select ville, max(pays) as pays, count(distinct visiteur) as n
        from public.site_visits where created_at >= debut and ville is not null and visiteur <> all(v_robots) and visiteur <> all(v_exclus) group by ville order by 3 desc limit 8
      ) v
    ),
    'localisation', jsonb_build_object(
      'haiti', (select count(distinct visiteur) from public.site_visits where created_at >= debut and pays = 'HT' and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
      'diaspora', (select count(distinct visiteur) from public.site_visits where created_at >= debut and pays is not null and pays <> 'HT' and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
      'inconnu', (select count(distinct visiteur) from public.site_visits where created_at >= debut and pays is null and visiteur <> all(v_robots) and visiteur <> all(v_exclus))
    ),
    'appareils', jsonb_build_object(
      'mobile', (select count(distinct visiteur) from public.site_visits where created_at >= debut and appareil = 'mobile' and visiteur <> all(v_robots) and visiteur <> all(v_exclus)),
      'ordinateur', (select count(distinct visiteur) from public.site_visits where created_at >= debut and appareil = 'ordinateur' and visiteur <> all(v_robots) and visiteur <> all(v_exclus))
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
          where created_at >= debut and event_id is not null and visiteur <> all(v_robots) and visiteur <> all(v_exclus) group by 1
        ) x
        join public.events e on e.id = x.event_id
        left join (
          select event_id,
                 count(*) filter (where type = 'flyer') as flyers,
                 count(*) filter (where type = 'agenda') as agendas
          from public.site_actions where created_at >= debut and visiteur <> all(v_robots) and visiteur <> all(v_exclus) group by 1
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

revoke all on function public.enregistrer_visite(uuid, text, text, text, text, text, text, text, boolean) from public;
revoke all on function public.signaler_presence(uuid, text, text, boolean) from public;
revoke all on function public.statistiques_admin(text) from public;
grant execute on function public.enregistrer_visite(uuid, text, text, text, text, text, text, text, boolean) to anon, authenticated;
grant execute on function public.signaler_presence(uuid, text, text, boolean) to anon, authenticated;
grant execute on function public.statistiques_admin(text) to authenticated;
