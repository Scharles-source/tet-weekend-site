-- Étiquettes de lien (15 nov. 2026) : savoir, visite par visite, QUEL partage a
-- amené le visiteur. La colonne `source` ne garde que le canal (whatsapp,
-- google…) ; on ajoute le référent complet et les paramètres utm_* du lien
-- d'arrivée, transmis par le client (lib/listing/mesure.ts) via /api/mesure.
-- Nouvelle signature d'enregistrer_visite avec les 4 champs en plus ; l'ancienne
-- signature délègue, pour que le site en production continue de fonctionner
-- pendant le déploiement du nouveau code.

alter table public.site_visits
  add column if not exists referrer text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

create or replace function public.enregistrer_visite(
  p_visiteur uuid, p_chemin text, p_slug text, p_source text, p_pays text,
  p_ville text, p_appareil text, p_user_agent text default null,
  p_exclu boolean default false,
  p_referrer text default null, p_utm_source text default null,
  p_utm_medium text default null, p_utm_campaign text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  insert into public.site_visits (visiteur, chemin, event_id, source, pays, ville, appareil, user_agent, est_robot, est_exclu, referrer, utm_source, utm_medium, utm_campaign)
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
    v_exclu,
    nullif(left(p_referrer, 300), ''),
    nullif(left(p_utm_source, 60), ''),
    nullif(left(p_utm_medium, 60), ''),
    nullif(left(p_utm_campaign, 80), '')
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
$function$;

-- Ancienne signature : délègue à la nouvelle (les champs d'étiquette à null).
create or replace function public.enregistrer_visite(
  p_visiteur uuid, p_chemin text, p_slug text, p_source text, p_pays text,
  p_ville text, p_appareil text, p_user_agent text default null,
  p_exclu boolean default false
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform public.enregistrer_visite(
    p_visiteur, p_chemin, p_slug, p_source, p_pays, p_ville, p_appareil,
    p_user_agent, p_exclu, null, null, null, null
  );
end;
$function$;

grant execute on function public.enregistrer_visite(uuid, text, text, text, text, text, text, text, boolean, text, text, text, text) to anon, authenticated;
