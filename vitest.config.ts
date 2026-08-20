import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

/**
 * Deux suites, deux environnements.
 *
 * `logique` couvre `lib/clyde` sans DOM : les règles d'idempotence des bonus ou
 * de calcul de prix n'ont pas besoin d'un rendu pour être vérifiées, et un
 * environnement `node` les garde rapides.
 *
 * `rendu` couvre les blocs de la vitrine, qui existent précisément pour
 * produire du DOM. Ces tests sont la contrepartie du découpage de `blocks.tsx`
 * en dix-sept modules : ils vérifient que chaque bloc s'affiche encore, ce
 * qu'aucun contrôle de types ne peut affirmer.
 *
 * L'alias `@/` doit être répété ici : vitest ne lit pas les `paths` du
 * tsconfig, et `demo-data` charge les crédits d'images par ce chemin.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'logique',
          environment: 'node',
          include: ['lib/**/__tests__/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'rendu',
          environment: 'happy-dom',
          include: ['components/**/__tests__/**/*.test.tsx'],
          setupFiles: ['./tests/setup-dom.ts'],
        },
      },
    ],
  },
})
