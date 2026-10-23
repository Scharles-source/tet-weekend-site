-- Bannière d'accueil : période pendant laquelle un événement publié est sponsorisé.
-- anon n'a qu'un GRANT par colonne. Sans ces deux colonnes dans le GRANT,
-- une lecture PostgREST qui les demande répond 401 et vide le site.

alter table public.events
  add column if not exists sponsored_from timestamptz,
  add column if not exists sponsored_to timestamptz;

grant select (sponsored_from, sponsored_to) on public.events to anon;

notify pgrst, 'reload schema';
