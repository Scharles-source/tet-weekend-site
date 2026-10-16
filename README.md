# Tèt Weekend — Site Web

Site public Next.js. Expérience principale : **Menus & Budgets** (Supabase). Les pages événements historiques lisent encore Firebase.

## Stack
- **Next.js 16** (App Router, TypeScript)
- **Supabase** (offre gratuite) — Menus & Budgets, lecture publique via clé anon + RLS
- **Firebase** (Firestore — lectures publiques uniquement, pages événements historiques)
- **Tailwind CSS 4**
- **Google Fonts** : Syne + DM Sans

## Pages
| Route | Description |
|-------|-------------|
| `/` | Menus & Budgets : recherche + filtres (zone, budget max/personne, cuisine) |
| `/restaurant/[slug]` | Fiche restaurant, menu par catégories, simulateur de budget |
| `/events` | Liste filtrée de tous les événements |
| `/events/[id]` | Détail d'un événement + mediaStack |
| `/trending` | Classement viral complet |

## Démarrage

```bash
npm install
npm run dev
```

## Variables d'environnement

Crée un fichier `.env.local` à la racine :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## Déploiement (Vercel — recommandé)

```bash
npm install -g vercel
vercel
```

Ajoute les variables d'env dans le dashboard Vercel.

## Déploiement (Firebase Hosting)

```bash
npm run build
npx firebase-tools deploy --only hosting
```

Configure `firebase.json` pour pointer sur le dossier `.next` ou `out`.

---

# Menus & Budgets (Supabase)

## Mise en place (manuel, une fois)

1. Créer un projet Supabase (offre gratuite).
2. Appliquer les migrations de `supabase/migrations/` dans l'ordre (SQL Editor, ou `supabase db push`) :
   - `20261014000000_menus_budgets.sql` : tables `restaurants`, `menu_items`, `settings`, RLS, réglages par défaut ;
   - `20261014000100_amorce_24_restaurants.sql` : les 24 restaurants vérifiés le 14 oct. 2026, **en brouillon et sans menu**.
3. Dans Vercel, ajouter les variables puis redéployer (elles sont lues au build) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<projet>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé anon>
```

Sans ces variables, les pages affichent « Configuration Supabase manquante » au lieu de planter.

4. Dans la table `settings`, renseigner :
   - `taux_htg_usd` : taux global HTG pour 1 USD. Amorcé à `0` (= non renseigné : conversions désactivées) ;
   - `contact_email` et/ou `contact_whatsapp` : contact pour les demandes de correction ou de retrait (WhatsApp au format international, ex. `509XXXXXXXX`).

> La clé `service_role` ne sert qu'au script d'import, en local. Ne jamais la mettre dans Vercel en `NEXT_PUBLIC_*`, ni la commiter.

## Sécurité (RLS)

- `restaurants` : lecture publique des seules lignes `statut = 'publie'`, colonnes d'affichage uniquement (les notes internes, le motif de retrait et les notes Google ne sont pas exposés).
- `menu_items` : lecture publique des seuls articles d'un restaurant publié.
- `settings` : lecture publique de `taux_htg_usd`, `contact_email` et `contact_whatsapp`.
- Aucune écriture depuis le client public.

## Règles de publication et de retrait

- Un restaurant apparaît dans le répertoire si **`statut = publie` ET au moins un article au menu**. Aucun accord préalable n'est requis (prix et noms de plats sont des faits).
- Ne jamais réutiliser les photos ou le logo d'un restaurant sans son accord (`photo_carte_url` uniquement avec accord). Ne jamais présenter un restaurant comme partenaire.
- **Retrait sur demande, immédiat** : passer `statut = 'retire'` (et `retrait_demande_le`, `motif_retrait`). Le restaurant disparaît aussitôt du public (fiche en 404).
- Fraîcheur : « Carte vérifiée il y a X jours » jusqu'à 30 jours après `date_dernier_releve`, puis « Prix en cours de vérification ». La date du relevé reste toujours affichée.

## Import tableur (`scripts/import-menus.mjs`)

```bash
# .env.import (non commité) : SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...
node --env-file=.env.import scripts/import-menus.mjs --restaurants fiches.csv --menu menus.csv --dry-run
node --env-file=.env.import scripts/import-menus.mjs --restaurants fiches.csv --menu menus.csv
```

- `--dry-run` : valide les fichiers sans rien écrire.
- `--remplacer-menu` : supprime d'abord le menu existant de chaque restaurant présent dans le fichier menu. Sans cette option, les articles sont mis à jour par clé (restaurant, catégorie, nom), et les articles absents du fichier restent en base.
- Formats acceptés : CSV (séparateur `,` ou `;`, UTF-8, guillemets pour les textes contenant des virgules) ou JSON (tableau d'objets avec les mêmes clés).
- Exemples **fictifs** : `data/exemple-restaurants.csv`, `data/exemple-menu.csv`. Ne pas les importer en production.

### Fichier « fiches » (une ligne par restaurant, clé = `slug`)

Cellule vide = **valeur inchangée** (jamais remplie par défaut). Pour effacer une valeur, écrire `NULL`. Booléens : `oui` / `non`. Listes : séparées par `|`.

| Colonne | Format | Description |
|---|---|---|
| `slug` | `minuscules-et-tirets` | **Obligatoire.** Identifiant unique, utilisé dans l'URL `/restaurant/<slug>` |
| `nom` | texte | Obligatoire à la création |
| `zones` | `Pétion-Ville` et/ou `Delmas`, séparées par `\|` | Obligatoire à la création, sert au filtre « zone » |
| `quartier` | texte | Quartier précis, ex. « Delmas 75 » |
| `adresse` | texte | |
| `point_repere` | texte | |
| `latitude`, `longitude` | nombre décimal | Pour l'itinéraire (sinon l'adresse est utilisée) |
| `whatsapp`, `telephone` | texte | Format international conseillé, ex. `+509 3X XX XX XX` |
| `instagram` | handle | Avec ou sans `@` |
| `horaires` | texte | Ex. « Lun–Sam 11 h – 22 h » |
| `jours_fermeture` | texte | |
| `heure_limite_cuisine` | texte | |
| `type_cuisine` | texte | Sert au filtre « type de cuisine » : garder une orthographe constante |
| `ambiance` | texte | |
| `devise` | `HTG` ou `USD` | Devise des prix de la carte |
| `taux_htg_usd` | nombre > 0 | Taux appliqué par le restaurant (HTG pour 1 USD). Vide = taux global |
| `taxe_pct`, `service_pct` | nombre 0–100 | |
| `taxe_incluse`, `service_inclus` | oui / non | |
| `parking_garde`, `groupe_electrogene`, `climatisation`, `terrasse` | oui / non | Vide = « non renseigné » |
| `modes_paiement` | liste `\|` | Ex. `Espèces\|MonCash\|Carte` |
| `photo_carte_url` | URL | **Uniquement avec l'accord du restaurant** |
| `date_dernier_releve` | `AAAA-MM-JJ` ou `JJ/MM/AAAA` | Calcule le badge de fraîcheur |
| `releve_par` | texte | |
| `statut` | `brouillon`, `publie`, `retire` | `retire` remplit `retrait_demande_le` (aujourd'hui) s'il est vide |
| `retrait_demande_le` | date | |
| `motif_retrait` | texte | |

### Fichier « menu » (une ligne par article)

| Colonne | Format | Description |
|---|---|---|
| `restaurant_slug` | slug | **Obligatoire.** Le restaurant doit déjà exister |
| `categorie` | `Entrées`, `Plats`, `Desserts`, `Boissons`, `Cocktails` | **Obligatoire.** La fourchette de prix est calculée sur `Plats` |
| `nom` | texte | **Obligatoire.** Unique par (restaurant, catégorie) |
| `description` | texte court | Optionnel |
| `prix` | nombre ≥ 0 | **Obligatoire.** `2500`, `2 500` ou `12,50` acceptés |
| `devise` | `HTG` ou `USD` | **Obligatoire.** Devise d'origine de l'article |
| `disponible` | oui / non | Défaut `oui` |
| `ordre` | entier | Ordre d'affichage dans la catégorie (défaut : ordre des lignes) |

## Simulateur de budget

Calcul (`lib/menus/budget.ts`, testé dans `lib/menus/budget.test.ts`) :

1. Chaque article garde sa devise. Le sous-total est calculé dans la devise du restaurant, chaque ligne étant convertie au taux applicable : taux saisi par l'utilisateur, sinon taux du restaurant, sinon taux global.
2. Taxe et service, si non inclus : pourcentage du sous-total, ajouté. S'ils sont inclus, rien n'est ajouté et la mention « taxes incluses » / « service inclus » s'affiche.
3. Pourboire optionnel (défaut 0 %), appliqué sur sous-total + taxe + service.
4. Total et part par personne, en HTG et en USD, avec le taux utilisé affiché à côté.
5. Calcul en centimes entiers (pas de décimales parasites). HTG affichés sans décimales quand le montant est rond (`4 428 HTG`), au centime sinon (`4 427,50 HTG`) ; USD toujours au cent.
6. Si le taux est inconnu et que le plateau mélange les devises, le calcul est refusé, avec un message : aucun taux n'est inventé.

Le plateau (articles, personnes, pourboire, taux saisi) est conservé dans le `localStorage` du navigateur, par restaurant.

## Admin `/admin`

Page unique `https://www.tetweekend.com/admin` (non liée depuis le site public, `noindex`). Connexion Google du compte `smithcharles8484@gmail.com`, puis session Supabase. Seul un profil `is_admin = true` voit la section **Restaurants et menus** (publier / dépublier / retirer, articles). Les écritures passent par la session de l'utilisateur (JWT + RLS), jamais par `service_role`.

Statuts enregistrés : `brouillon`, `publie`, `retire` (sans accent).

## Vérifications

```bash
npm run typecheck && npm run lint && npm test && npm run build
```
