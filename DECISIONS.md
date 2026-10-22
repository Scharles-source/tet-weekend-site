# Décisions

## 22 octobre 2026 — Menus abandonnés

Tèt Weekend devient un listing d'événements haïtiens (Haïti + diaspora). Pas de billetterie.

- Le brief complet est dans `docs/PLAN-LISTING-EVENEMENTS.md`.
- Les tables `restaurants` et `menu_items` restent en base. Le site ne les lit plus.
- Les 24 restaurants d'amorce sont copiés dans `venues`, en `brouillon`, pays Haïti, sans description ni type inventés. Une ville n'est reprise que si le restaurant n'avait qu'une seule zone.
- Statuts enregistrés : `brouillon`, `publie`, `retire` (sans accent).
- Le prix d'entrée est un texte libre. Vide s'il n'est pas connu. Pas d'offre schema.org chiffrée.
- L'image du flyer n'est pas reprise. La fiche est en texte, avec le lien du post d'origine.
- Une page d'événement publié n'est pas supprimée après la date : elle affiche « Événement terminé ».
- Le sitemap ne liste que les événements à venir.
- L'heure saisie dans l'admin est interprétée dans le fuseau choisi (Haïti par défaut).
- `follows` et les alertes ne sont pas créés (phase 3). Les statistiques de vues non plus.
- `watch_accounts` existe. On peut y ajouter des comptes. Aucun scan (phase 2).
- Les pages Firebase `/events` et `/trending` restent en place. La navigation pointe vers `/evenements`, `/lieux` et `/artistes`.
