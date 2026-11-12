-- Engagement public anonyme : « J'y vais » et vues des fiches.
-- Aucune lecture/écriture directe pour les visiteurs : tout passe par trois fonctions.
-- Un visiteur est un identifiant aléatoire gardé dans son navigateur (pas de compte, pas de donnée personnelle).

create table if not exists public.event_views (
  event_id uuid not null references public.events (id) on delete cascade,
  visiteur uuid not null,
  jour     date not null default current_date,
  primary key (event_id, visiteur, jour)
);

create table if not exists public.event_interests (
  event_id   uuid not null references public.events (id) on delete cascade,
  visiteur   uuid not null,
  created_at timestamptz not null default now(),
  primary key (event_id, visiteur)
);

alter table public.event_views enable row level security;
alter table public.event_interests enable row level security;
-- Volontairement aucune policy : les tables ne sont pas lisibles directement avec la clé publique.

create or replace function public.enregistrer_vue(p_event uuid, p_visiteur uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_views (event_id, visiteur)
  select e.id, p_visiteur from public.events e
  where e.id = p_event and e.statut = 'publie'
  on conflict do nothing;
end;
$$;

create or replace function public.basculer_interet(p_event uuid, p_visiteur uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
  deja boolean;
  n bigint;
begin
  select exists (select 1 from public.events e where e.id = p_event and e.statut = 'publie') into ok;
  if not ok then
    return jsonb_build_object('interesse', false, 'total', 0);
  end if;
  select exists (select 1 from public.event_interests i where i.event_id = p_event and i.visiteur = p_visiteur) into deja;
  if deja then
    delete from public.event_interests i where i.event_id = p_event and i.visiteur = p_visiteur;
  else
    insert into public.event_interests (event_id, visiteur) values (p_event, p_visiteur) on conflict do nothing;
  end if;
  select count(*) into n from public.event_interests i where i.event_id = p_event;
  return jsonb_build_object('interesse', not deja, 'total', n);
end;
$$;

create or replace function public.evenements_engagement()
returns table (event_id uuid, interets bigint, vues bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.id,
         (select count(*) from public.event_interests i where i.event_id = e.id),
         (select count(*) from public.event_views v where v.event_id = e.id)
  from public.events e
  where e.statut = 'publie';
$$;

revoke all on function public.enregistrer_vue(uuid, uuid) from public;
revoke all on function public.basculer_interet(uuid, uuid) from public;
revoke all on function public.evenements_engagement() from public;
grant execute on function public.enregistrer_vue(uuid, uuid) to anon, authenticated;
grant execute on function public.basculer_interet(uuid, uuid) to anon, authenticated;
grant execute on function public.evenements_engagement() to anon, authenticated;
