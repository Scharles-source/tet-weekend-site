# Tèt Weekend — Site Web

Site public Next.js connecté au même projet Firebase que l'app Android et le dashboard admin.

## Stack
- **Next.js 15** (App Router, TypeScript)
- **Firebase** (Firestore — lectures publiques uniquement)
- **Tailwind CSS 4**
- **Google Fonts** : Syne + DM Sans

## Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page + aperçu événements + trending |
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
