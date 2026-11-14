-- Soumissions du formulaire « Add an event / Become a partner » : plus d'e-mail, tout est enregistré ici
-- et se lit dans l'admin (section « Soumissions »). Aucune dépendance à Resend.
-- Les visiteurs n'ont aucun accès direct à la table ; seule la fonction enregistrer_soumission() leur est ouverte.

create table if not exists public.soumissions (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  nom            text not null,
  email          text not null,
  telephone      text,
  evenement      text not null,
  date_evenement text not null,   -- texte libre : le champ « date » du formulaire n'est pas une date stricte
  lieu           text not null,
  details        text,
  flyer_path     text not null,   -- chemin dans le bucket privé « soumissions-flyers »
  statut         text not null default 'nouveau' check (statut in ('nouveau', 'lu', 'traite', 'archive'))
);
create index if not exists soumissions_created_idx on public.soumissions (created_at desc);
alter table public.soumissions enable row level security;
-- Volontairement aucune policy : aucune lecture ni écriture directe avec la clé publique.

-- Enregistrement depuis le site (anonyme). Le serveur a déjà validé le formulaire ; on revalide ici par sécurité.
create or replace function public.enregistrer_soumission(
  p_nom text, p_email text, p_telephone text, p_evenement text, p_date text, p_lieu text, p_details text, p_flyer_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nom text := left(btrim(coalesce(p_nom, '')), 2000);
  v_email text := left(btrim(coalesce(p_email, '')), 2000);
  v_evenement text := left(btrim(coalesce(p_evenement, '')), 2000);
  v_date text := left(btrim(coalesce(p_date, '')), 2000);
  v_lieu text := left(btrim(coalesce(p_lieu, '')), 2000);
  v_flyer text := left(btrim(coalesce(p_flyer_path, '')), 2000);
begin
  if v_nom = '' or v_evenement = '' or v_lieu = '' or v_date = '' or v_flyer = '' or position('@' in v_email) = 0 then
    raise exception 'Soumission invalide' using errcode = '22023';
  end if;
  insert into public.soumissions (nom, email, telephone, evenement, date_evenement, lieu, details, flyer_path)
  values (
    v_nom, v_email,
    nullif(left(btrim(coalesce(p_telephone, '')), 2000), ''),
    v_evenement, v_date, v_lieu,
    nullif(left(btrim(coalesce(p_details, '')), 2000), ''),
    v_flyer
  );
end;
$$;

-- Lecture admin : les 100 dernières soumissions, de la plus récente à la plus ancienne.
create or replace function public.soumissions_admin()
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
    (select jsonb_agg(to_jsonb(s) order by s.created_at desc)
       from (select * from public.soumissions order by created_at desc limit 100) s),
    '[]'::jsonb
  );
end;
$$;

-- Changement de statut (admin).
create or replace function public.marquer_soumission(p_id uuid, p_statut text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_admin() then
    raise exception 'Accès réservé' using errcode = '42501';
  end if;
  if p_statut is null or p_statut not in ('nouveau', 'lu', 'traite', 'archive') then
    raise exception 'Statut invalide' using errcode = '22023';
  end if;
  update public.soumissions set statut = p_statut where id = p_id;
end;
$$;

revoke all on function public.enregistrer_soumission(text, text, text, text, text, text, text, text) from public;
revoke all on function public.soumissions_admin() from public;
revoke all on function public.marquer_soumission(uuid, text) from public;
grant execute on function public.enregistrer_soumission(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.soumissions_admin() to authenticated;
grant execute on function public.marquer_soumission(uuid, text) to authenticated;

-- Stockage des flyers : bucket PRIVÉ (5 Mo, images seulement).
-- Le site envoie le fichier avec la clé publique : il faut donc une règle d'envoi seul (jamais de lecture publique) ;
-- l'admin lit les flyers par URL signée. Si ce bloc est refusé (droits sur le schéma storage), créer le bucket
-- « soumissions-flyers » (privé) et ces deux règles à la main dans le tableau de bord Supabase.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('soumissions-flyers', 'soumissions-flyers', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do nothing;

  drop policy if exists "soumissions_flyers_envoi" on storage.objects;
  create policy "soumissions_flyers_envoi" on storage.objects
    for insert to anon, authenticated
    with check (bucket_id = 'soumissions-flyers');

  drop policy if exists "soumissions_flyers_lecture_admin" on storage.objects;
  create policy "soumissions_flyers_lecture_admin" on storage.objects
    for select to authenticated
    using (bucket_id = 'soumissions-flyers' and public.est_admin());
exception when insufficient_privilege then
  raise notice 'Bucket soumissions-flyers et règles de stockage à créer à la main (droits insuffisants sur storage).';
end;
$$;
