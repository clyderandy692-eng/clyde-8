<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CLYDE — protocole de vérification

## L'aperçu de développement ne mesure pas les images

`/_next/image` renvoie **404** sur `next dev` dans ce bac à sable, alors qu'un vrai build sert bien
du WebP. Une session a déjà conclu à tort que `next/image` était cassé, et failli « corriger » du
code qui fonctionnait.

- Le marqueur fiable dans le HTML est l'attribut **`data-nimg`**, jamais la présence de
  `/_next/image` dans le `src`.
- Toute mesure d'image, de poids de page ou de Web Vitals se fait sur `pnpm build && pnpm start`.
  Une mesure prise en développement ne prouve rien, ni dans un sens ni dans l'autre.

## Les hôtes d'images sont une liste fermée

Les URL de médias sont saisies par les commerçants. `next/image` sur un hôte absent de
`images.remotePatterns` échoue **en production seulement** — le développement ne le montre pas.

- Passer par `components/clyde/photo.tsx`, qui optimise ce qui est autorisé et retombe en balise
  simple sinon. Ne jamais appeler `next/image` directement sur une URL de commerçant.
- La liste des hôtes vit dans `lib/clyde/image-hosts.mjs`, partagée avec `next.config.mjs`.

## Contraintes Next.js 16 déjà rencontrées

- `ssr: false` est interdit dans un composant serveur : passer par une enveloppe `'use client'`
  intermédiaire (voir `lofi-player-lazy.tsx`).
- `useSearchParams` fait sortir la page du prérendu statique. Pour un paramètre qui ne sert qu'au
  premier passage, lire `window.location.search` derrière la garde d'hydratation (voir
  `first-run.tsx`) garde la route statique au build.

## Tests

Deux suites, deux environnements (voir `vitest.config.ts`) :

- `logique` — `lib/**/__tests__/*.test.ts`, environnement `node`, aucun DOM.
- `rendu` — `components/**/__tests__/*.test.tsx`, environnement `happy-dom`.

Règles de rédaction :

- Interroger le **rôle accessible** plutôt que le libellé : le texte appartient au dictionnaire et
  doit pouvoir être réécrit sans casser une suite qui teste un comportement.
- `render()` de testing-library exécute déjà les effets. Pour vérifier qu'un composant n'émet rien
  avant hydratation, utiliser `renderToStaticMarkup` — pas `render`.
- Une règle métier reçoit un test nominal **et** un test de régression.
