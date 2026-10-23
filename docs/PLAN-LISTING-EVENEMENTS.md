# Tèt Weekend — Pivot « listing d'événements haïtiens » (plan v1, 22 oct. 2026)

Décision de Smith (22 oct. 2026) : les menus de restaurants sont abandonnés. Tèt Weekend devient un site de listing d'événements haïtiens — Haïti + diaspora. Pas de billetterie : on dit où et quand ça se passe, on ne vend pas de billets.

Démarrage codé dans Cursor, reprise prévue par Jarvis. Toute décision qui contredit ce plan est notée dans `DECISIONS.md`.

## Produit

Savoir où et quand a lieu un événement, ou ce que fait un DJ ce weekend. Public : Haïtiens en Haïti et dans la diaspora (Montréal, Miami, New York, Boston, Paris).

## Pages

Piliers, indexés, qui ne disparaissent pas :

- `/lieux/<slug>` — lieu, adresse, carte, événements à venir et passés.
- `/artistes/<slug>` — bio courte, dates, lieux habituels.
- `/villes/<slug>` — événements de la ville, et la section « ce weekend ».
- `/categories/<slug>` — bals, concerts, soirées kompa, festivals.

Événements :

- `/evenements/<slug>` — titre, date, lieu, artistes, prix si connu, description, lien vers le post d'origine, ajout au calendrier.
- Créée à la publication. Données schema.org `Event` (startDate, location, performer).
- Après la date : pas de suppression. La page dit « Événement terminé » et montre les prochains événements du même artiste et du même lieu.
- Le sitemap ne liste que les événements à venir. Les pages terminées restent accessibles.

## Données

Projet Supabase `cuqvrwekndbpaacftmus`. Migration `supabase/migrations/20261022000000_listing_evenements.sql`.

- `venues`, `artists`, `events`, `event_artists`, `watch_accounts`.
- Statuts : `brouillon`, `publie`, `retire`.
- `follows` et les alertes : phase 3, pas encore créés.
- Grants explicites dans la migration (select anon sur les colonnes publiques, CRUD authenticated, tout pour `service_role`).

## Repérage

Phase 2. La table `watch_accounts` et le centre **Collecte — Événements** existent. Le runner local exécute les jobs. Pas de publication automatique. Les faits (date, lieu, prix, artistes) se publient. Depuis le 22 octobre 2026, un flyer ajouté par l'admin est affiché en entier ; il se masque sur demande, sans retirer l'événement.

## Phases

1. Châssis : menus retirés du site, modèle, pages, dashboard, saisie manuelle. Les 24 restaurants deviennent des lieux brouillon.
2. Veille sur les comptes, extraction, file de validation.
3. Suivis, alertes, SEO poussé.
4. Mise en avant payante, plus tard.

## Reprise

Tout le travail est poussé sur `Scharles-source/tet-weekend-site`. Les migrations sont dans le dépôt. Jarvis reprend à partir du dépôt et de ce plan.
