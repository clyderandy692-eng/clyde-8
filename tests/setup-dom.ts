/**
 * Amorce de la suite de rendu.
 *
 * happy-dom fournit un DOM, pas un navigateur : les API que les blocs
 * appellent au montage manquent et leur absence ferait échouer le rendu pour
 * une raison qui n'a rien à voir avec ce qu'on teste. On les remplit ici, une
 * fois, plutôt que dans chaque fichier de test.
 */

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/* Le carrousel et le rail observent leur conteneur pour savoir s'il déborde. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

/* La galerie et le catalogue déclenchent leurs apparitions au défilement. */
class IntersectionObserverStub {
  root = null
  rootMargin = ''
  thresholds: number[] = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver

/* Les blocs lisent `matchMedia` pour distinguer mobile et bureau. */
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof matchMedia

/* Le rail appelle `scrollTo`, que happy-dom ne pose pas sur les éléments. */
Element.prototype.scrollTo ??= function scrollTo() {}

/* Rien ne sort vers le réseau pendant les tests. */
globalThis.fetch = vi.fn(
  async () => new Response('', { status: 200 }),
) as unknown as typeof fetch

/*
 * happy-dom va chercher pour de vrai le `src` des iframes. Le bloc horaires
 * embarque une carte Google : la suite dépendait donc du réseau et noyait sa
 * sortie sous des `NetworkError`. Les tests portent sur le DOM produit, jamais
 * sur ce qu'un tiers renvoie.
 *
 * Le réglage se pose ici et pas dans `environmentOptions` : vitest ne
 * transmet pas ces options aux projets, et l'iframe se charge avant que le
 * premier test n'ait la main.
 */
const happyWindow = globalThis as unknown as {
  happyDOM?: { settings: { disableIframePageLoading: boolean; disableJavaScriptFileLoading: boolean } }
}
if (happyWindow.happyDOM) {
  happyWindow.happyDOM.settings.disableIframePageLoading = true
  happyWindow.happyDOM.settings.disableJavaScriptFileLoading = true
}

/* Chaque test repart d'un document vide : sans cela, les blocs d'un test
   précédent restent attachés et les requêtes par texte trouvent deux fois la
   même chose. */
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
