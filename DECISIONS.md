# Décisions

## 22 octobre 2026 — Menus abandonnés

Tèt Weekend devient un listing d'événements haïtiens (Haïti + diaspora). Pas de billetterie.

- Le brief complet est dans `docs/PLAN-LISTING-EVENEMENTS.md`.
- Les tables `restaurants` et `menu_items` restent en base. Le site ne les lit plus.
- Les 24 restaurants d'amorce sont copiés dans `venues`, en `brouillon`, pays Haïti, sans description ni type inventés. Une ville n'est reprise que si le restaurant n'avait qu'une seule zone.
- Statuts enregistrés : `brouillon`, `publie`, `retire` (sans accent).
- Le prix d'entrée est un texte libre. Vide s'il n'est pas connu. Pas d'offre schema.org chiffrée.
- L'image du flyer n'était pas reprise au départ. Cette règle est remplacée le 22 octobre 2026 : voir la décision suivante.
- Une page d'événement publié n'est pas supprimée après la date : elle affiche « Événement terminé ».
- Le sitemap ne liste que les événements à venir.
- L'heure saisie dans l'admin est interprétée dans le fuseau choisi (Haïti par défaut).
- `follows` et les alertes ne sont pas créés (phase 3). Les statistiques de vues non plus.
- `watch_accounts` existe. On peut y ajouter des comptes. Aucun scan (phase 2).
- Les pages Firebase `/events` et `/trending` restent en place. La navigation pointe vers `/evenements`, `/lieux` et `/artistes`.

## 22 octobre 2026 — Flyer en en-tête

Pour un événement qui a un flyer, le visuel de la carte et de la page est le flyer entier (`object-fit: contain`), avec un fond flou. Un clic ouvre le fichier original en plein écran. Le dégradé de marque reste le repli sans flyer, si le flyer est masqué, ou si l'image échoue.

- `source` reste la plateforme et `source_url` l'URL du post. On ajoute `source_account` et `spotted_at`, pas de colonnes en double.
- Le prix vide reste vide. « Gratuit » n'est enregistré que si l'admin le choisit.
- Masquer le flyer efface son URL publique et garde le fichier. L'événement peut rester publié.
- La catégorie `autre` s'ajoute à bals, concerts, soirees-kompa et festivals.
- Aucune version recadrée n'est générée : la carte et la visionneuse lisent le fichier original. `flyer_card_url` reste disponible.
- Bucket Storage : `event-flyers`. Écriture par la session admin, jamais avec `service_role` dans le navigateur.
