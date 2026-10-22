# Tèt Weekend — site

Listing d'événements haïtiens (Haïti et diaspora). On indique où et quand ça se passe. On ne vend pas de billets.

Le brief est dans `docs/PLAN-LISTING-EVENEMENTS.md`. Les décisions qui s'en écartent sont dans `DECISIONS.md`.

## Stack

- Next.js 16 (App Router, TypeScript)
- Supabase : lieux, artistes, événements. Lecture publique des lignes `publie` via la clé anon et la RLS. Écritures admin via la session Google (JWT), jamais `service_role` dans le navigateur ni sur Vercel.
- Firebase : pages historiques `/events` et `/trending` seulement.

## Pages

| Route | Rôle |
|---|---|
| `/` | Événements à venir |
| `/evenements/[slug]` | Fiche. Reste en ligne après la date (« Événement terminé ») |
| `/lieux/[slug]` | Lieu, carte, dates |
| `/artistes/[slug]` | Artiste, dates, lieux |
| `/villes/[slug]` | Événements de la ville, dont ce weekend |
| `/categories/[slug]` | bals, concerts, soirees-kompa, festivals |
| `/admin` | Saisie manuelle. Connexion Google `smithcharles8484@gmail.com` |

Les statuts enregistrés sont `brouillon`, `publie`, `retire` (sans accent).

## Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
```

Sans ces variables, les pages affichent « Configuration Supabase manquante ».

## Migrations

Appliquer les fichiers de `supabase/migrations/` dans l'ordre. `20261022000000_listing_evenements.sql` crée les tables du listing et copie les 24 restaurants en lieux brouillon.

## Vérifications

```bash
npm run typecheck && npm run lint && npm test && npm run build
```
