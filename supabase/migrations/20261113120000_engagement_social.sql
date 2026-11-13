-- Preuve sociale et « I'm in » définitif.
-- 1. confirmer_interet : ajoute le visiteur une seule fois (idempotent, jamais de retrait).
-- 2. evenements_engagement_jour : comme evenements_engagement, avec en plus les vues d'aujourd'hui.

create or replace function public.confirmer_interet(p_event uuid, p_visiteur uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
  n bigint;
begin
  select exists (select 1 from public.events e where e.id = p_event and e.statut = 'publie') into ok;
  if not ok then
    return jsonb_build_object('interesse', false, 'total', 0);
  end if;
  insert into public.event_interests (event_id, visiteur) values (p_event, p_visiteur) on conflict do nothing;
  select count(*) into n from public.event_interests i where i.event_id = p_event;
  return jsonb_build_object('interesse', true, 'total', n);
end;
$$;

create or replace function public.evenements_engagement_jour()
returns table (event_id uuid, interets bigint, vues bigint, vues_jour bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.id,
         (select count(*) from public.event_interests i where i.event_id = e.id),
         (select count(*) from public.event_views v where v.event_id = e.id),
         (select count(*) from public.event_views v where v.event_id = e.id and v.jour = current_date)
  from public.events e
  where e.statut = 'publie';
$$;

revoke all on function public.confirmer_interet(uuid, uuid) from public;
revoke all on function public.evenements_engagement_jour() from public;
grant execute on function public.confirmer_interet(uuid, uuid) to anon, authenticated;
grant execute on function public.evenements_engagement_jour() to anon, authenticated;
