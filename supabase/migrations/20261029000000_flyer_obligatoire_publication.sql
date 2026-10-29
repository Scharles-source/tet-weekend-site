-- Règle (Smith, 28 oct. 2026) : aucun événement publié sans flyer.
-- Verrou en base, en plus des verrous applicatifs (validation + changement de statut).
--
-- AVANT d'appliquer, vérifier qu'aucun événement déjà publié n'est sans flyer :
--   select id, titre from public.events
--   where statut = 'publie' and flyer_storage_path is null and flyer_url is null;
-- Si la requête renvoie des lignes, leur joindre un flyer d'abord (sinon la
-- contrainte stricte échouera ; la variante NOT VALID ci-dessous reste possible
-- mais ne protège que les nouvelles écritures ligne par ligne).
alter table public.events
  add constraint events_publication_flyer
  check (statut <> 'publie' or flyer_storage_path is not null or flyer_url is not null);
