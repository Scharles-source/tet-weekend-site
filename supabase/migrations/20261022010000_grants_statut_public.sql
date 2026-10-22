-- La politique de lecture publique compare statut, mais anon n'avait pas le droit
-- de lire cette colonne. PostgREST renvoyait alors 401 sur venues, artists et events.

grant select (statut) on public.venues to anon;
grant select (statut) on public.artists to anon;
grant select (statut) on public.events to anon;

notify pgrst, 'reload schema';
