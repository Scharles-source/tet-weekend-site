-- Le listing public lit les événements avec des grants de colonnes pour le rôle anon.
-- `created_at` n'en fait pas partie : on l'ouvre pour le badge « Nouveau » (simple date d'ajout).
-- Les lignes visibles restent celles que la policy RLS existante autorise (événements publiés).

grant select (created_at) on public.events to anon;
