-- Récaps vidéo : aftermovies de soirées passées montrés sur l'accueil (rangée « Recaps »).
-- Rien ne se charge tant qu'un visiteur n'a pas cliqué : l'accueil ne rend que des vignettes.
-- Les vidéos candidates arrivent en « a_valider » et se gèrent dans l'admin (section « Récaps vidéo »),
-- comme les Soumissions. Les visiteurs n'ont aucun accès direct à la table ; seule la fonction
-- recaps_publics() (récaps publiés uniquement) leur est ouverte.

create table if not exists public.recaps_video (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  titre           text not null,
  lieu_nom        text,
  compte_source   text,            -- ex. « @asulounge »
  plateforme      text not null default 'instagram' check (plateforme in ('instagram', 'youtube', 'autre')),
  post_url        text not null,   -- page du post d'origine
  post_id         text,            -- identifiant du post (shortcode Instagram, id YouTube…)
  video_url       text,            -- URL vidéo directe si fiable, sinon null (repli : lecteur intégré)
  vignette_url    text,            -- affiche affichée sur l'accueil (copie durable dans le stockage du site)
  evenement_label text,            -- texte libre : soirée + date, ex. « Sunset House · mars 2026 »
  evenement_date  date,
  statut          text not null default 'a_valider' check (statut in ('a_valider', 'publie', 'ecarte')),
  ordre           integer not null default 0
);
create index if not exists recaps_video_statut_idx on public.recaps_video (statut, ordre, evenement_date desc);
create unique index if not exists recaps_video_post_id_uidx on public.recaps_video (post_id) where post_id is not null;
alter table public.recaps_video enable row level security;
-- Volontairement aucune policy : aucune lecture ni écriture directe avec la clé publique.
-- Grants explicites (leçon du 30 oct. 2026 : plus d'octroi automatique aux nouvelles tables).
revoke all on table public.recaps_video from anon, authenticated;
grant select, insert, update, delete on table public.recaps_video to service_role;

-- Lecture publique : seulement les récaps publiés, du plus récent au plus ancien (ordre explicite d'abord).
create or replace function public.recaps_publics()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select jsonb_agg(r.objet order by r.ordre asc, r.evenement_date desc nulls last, r.created_at desc)
       from (select ordre, evenement_date, created_at,
                    jsonb_build_object(
                      'id', id, 'titre', titre, 'lieu_nom', lieu_nom, 'compte_source', compte_source,
                      'plateforme', plateforme, 'post_url', post_url, 'post_id', post_id,
                      'video_url', video_url, 'vignette_url', vignette_url,
                      'evenement_label', evenement_label, 'evenement_date', evenement_date
                    ) as objet
               from public.recaps_video
              where statut = 'publie'
              order by ordre asc, evenement_date desc nulls last, created_at desc
              limit 12) r),
    '[]'::jsonb
  );
$$;

-- Lecture admin : tous les récaps, à valider d'abord puis publiés puis écartés.
create or replace function public.recaps_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.est_admin() then
    raise exception 'Accès réservé' using errcode = '42501';
  end if;
  return coalesce(
    (select jsonb_agg(to_jsonb(r) order by r.rang, r.created_at desc)
       from (select *,
                    case statut when 'a_valider' then 0 when 'publie' then 1 else 2 end as rang
               from public.recaps_video
              order by case statut when 'a_valider' then 0 when 'publie' then 1 else 2 end, created_at desc
              limit 100) r),
    '[]'::jsonb
  );
end;
$$;

-- Changement de statut (admin) : publier, écarter ou remettre à valider.
create or replace function public.marquer_recap(p_id uuid, p_statut text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_admin() then
    raise exception 'Accès réservé' using errcode = '42501';
  end if;
  if p_statut is null or p_statut not in ('a_valider', 'publie', 'ecarte') then
    raise exception 'Statut invalide' using errcode = '22023';
  end if;
  update public.recaps_video set statut = p_statut, updated_at = now() where id = p_id;
end;
$$;

revoke all on function public.recaps_publics() from public;
revoke all on function public.recaps_admin() from public;
revoke all on function public.marquer_recap(uuid, text) from public;
grant execute on function public.recaps_publics() to anon, authenticated;
grant execute on function public.recaps_admin() to authenticated;
grant execute on function public.marquer_recap(uuid, text) to authenticated;
