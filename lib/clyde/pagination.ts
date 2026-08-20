/**
 * Affichage progressif des longues listes.
 *
 * Une boutique qui tourne accumule les commandes sans jamais en supprimer :
 * la liste ne cesse de croître alors que l'écran, lui, ne montre que le haut.
 * On ne rend donc que ce qui peut être lu, et l'on charge la suite à la demande.
 *
 * Le compteur est un état d'affichage, pas une donnée : il vit dans le
 * composant. Ce module se contente de le rendre inoffensif — un compteur
 * négatif, fractionnaire ou plus grand que la liste ne doit jamais produire une
 * tranche incohérente ni un bouton « voir plus » qui ne charge rien.
 */

export const DEFAULT_PAGE_SIZE = 20

export type Page<T> = {
  /** La tranche à rendre réellement. */
  items: T[]
  /** Reste-t-il quelque chose à révéler ? */
  hasMore: boolean
  /** Combien d'éléments restent cachés. */
  remaining: number
  /** Compteur à appliquer au prochain « voir plus ». */
  nextCount: number
}

export function pageSlice<T>(
  items: readonly T[],
  visibleCount: number = DEFAULT_PAGE_SIZE,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Page<T> {
  /* Une page ne peut pas être vide : un `pageSize` de zéro figerait la liste
     sur un bouton qui ne révèle rien. */
  const size = Math.max(1, Math.floor(pageSize) || DEFAULT_PAGE_SIZE)

  /* On borne le compteur des deux côtés : jamais moins d'une page, jamais plus
     que la liste. Sans la borne haute, `nextCount` s'envolerait à chaque clic
     et le bouton resterait affiché après le dernier élément. */
  const count = Math.min(
    Math.max(size, Math.floor(visibleCount) || size),
    items.length,
  )

  const shown = items.slice(0, count)
  const remaining = items.length - shown.length

  return {
    items: shown,
    hasMore: remaining > 0,
    remaining,
    nextCount: Math.min(shown.length + size, items.length),
  }
}
