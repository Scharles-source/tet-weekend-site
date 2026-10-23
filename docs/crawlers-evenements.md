# Crawlers d'événements

Le centre de contrôle est dans l'admin : **Collecte — Événements** (`/admin/collecte-evenements`).

Aucun événement trouvé par un crawler n'est publié tout seul. Il arrive dans la file **À valider**. L'approbation crée un brouillon, sauf si la case « Publier immédiatement après approbation » est cochée au moment du clic.

## Runner

Le site ne lance pas un scan dans la requête HTTP. Il crée un job. Le runner local l'exécute.

```bash
npm run events:runner
```

La variable `SUPABASE_SERVICE_ROLE_KEY` reste sur la machine qui lance le runner. Elle ne va pas dans le navigateur et pas dans Vercel.

Ctrl+C arrête le runner. Un job interrompu encore `running` revient en file.

Le bandeau dit **En ligne** seulement si le dernier battement a moins de 2 minutes. Sinon il dit **Hors ligne**. Aucun worker n'est hébergé : les scans ne tournent pas 24 h/24.

## Statuts des jobs

- `queued` : en file
- `running` : en cours
- `paused` : pause demandée
- `succeeded` : terminé
- `failed` : échec temporaire, après 3 essais automatiques
- `cancelled` : annulé
- `blocked` : plateforme ou `robots.txt` bloque. Pas de nouvel essai automatique. Le bouton **Réessayer** reste disponible après correction.

## Sources

- Instagram : désactivé. Importer une URL ou ajouter le flyer à la main.
- Facebook : désactivé sans voie officielle. Pas de lecture d'un mur de connexion.
- Eventbrite : API officielle seulement si `EVENTBRITE_API_TOKEN` est présent sur le runner. Sinon le scan est bloqué.
- Sites et RSS : pages publiques, `robots.txt` respecté, délai entre les requêtes.
- URL manuelle : le runner lit ce qui est public. Sinon le candidat reste en saisie assistée.

La planification automatique est éteinte par défaut.

## Runner hors ligne

Les boutons créent quand même des jobs. Ils attendent qu'un runner démarre. Rien ne se passe tant que `npm run events:runner` n'est pas lancé.

## Importer une URL

Colle l'URL dans le champ **Importer une URL**. Le job `import_url` est créé. Si la page n'est pas lisible sans connexion, le candidat apparaît vide, à compléter, avec le motif.
