-- Partages « Invite friends » : même mécanique que les vues (20261112000000).
-- Un partage par visiteur et par jour, compté au clic sur « Invite friends » (cartes et fiche).
-- Aucune lecture/écriture directe pour les visiteurs : tout passe par deux fonctions.
-- La table n'expose aucune colonne en SELECT public : les comptes ne sortent que par
-- evenements_engagement_partages (security definer), comme les vues.

create table if not exists public.event_shares (
  event_id uuid not null references public.events (id) on delete cascade,
  visiteur uuid not null,
  jour     date not null default current_date,
  primary key (event_id, visiteur, jour)
);

alter table public.event_shares enable row level security;
-- Volontairement aucune policy : la table n'est pas lisible directement avec la clé publique.

create or replace function public.enregistrer_partage(p_event uuid, p_visiteur uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_shares (event_id, visiteur)
  select e.id, p_visiteur from public.events e
  where e.id = p_event and e.statut = 'publie'
  on conflict do nothing;
end;
$$;

create or replace function public.evenements_engagement_partages()
returns table (event_id uuid, interets bigint, vues bigint, vues_jour bigint, partages bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.id,
         (select count(*) from public.event_interests i where i.event_id = e.id),
         (select count(*) from public.event_views v where v.event_id = e.id),
         (select count(*) from public.event_views v where v.event_id = e.id and v.jour = current_date),
         (select count(*) from public.event_shares s where s.event_id = e.id)
  from public.events e
  where e.statut = 'publie';
$$;

revoke all on function public.enregistrer_partage(uuid, uuid) from public;
revoke all on function public.evenements_engagement_partages() from public;
grant execute on function public.enregistrer_partage(uuid, uuid) to anon, authenticated;
grant execute on function public.evenements_engagement_partages() to anon, authenticated;
