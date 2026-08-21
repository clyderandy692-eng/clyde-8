/**
 * Détection statique des largeurs qui ne peuvent pas tenir sur un téléphone.
 *
 * Pourquoi statique, et non mesuré au rendu : les tests de rendu du projet
 * tournent sous `happy-dom`, qui ne calcule aucune mise en page —
 * `offsetWidth`, `scrollWidth` et `getBoundingClientRect().width` y valent
 * toujours 0. Un test qui prétendrait comparer une largeur de contenu à la
 * largeur de la fenêtre passerait donc quoi qu'il arrive, y compris sur un
 * écran franchement cassé. Mieux vaut un garde-fou modeste qui dit la vérité
 * qu'une mesure impossible qui rassure à tort.
 *
 * Ce que ce garde-fou attrape : une largeur IMPOSÉE en pixels, plus large que
 * l'écran de référence. C'est le seul débordement qu'on puisse affirmer sans
 * moteur de rendu — il ne dépend ni du contenu, ni de la police, ni du parent.
 *
 * Ce qu'il n'attrape pas, et qui reste à vérifier au navigateur : un texte long
 * sans `min-w-0`, une grille à colonnes fixes, un tableau large. Ces cas
 * dépendent du contenu réel et se voient à l'œil, aux trois largeurs de
 * référence.
 */

/** Le plus petit écran visé par le projet. */
export const NARROW_VIEWPORT = 390

/**
 * Marge intérieure typique d'un écran (`px-4` de chaque côté).
 *
 * Une largeur imposée au-delà de cette limite déborde même si l'élément est
 * seul sur sa ligne.
 */
export const USABLE_WIDTH = NARROW_VIEWPORT - 32

export interface FixedWidth {
  /** La classe fautive, telle qu'écrite. */
  className: string
  /** La largeur imposée, en pixels. */
  px: number
  /** Numéro de ligne, à partir de 1. */
  line: number
}

/**
 * Repère les largeurs imposées trop larges dans une source.
 *
 * On ne retient que `w-[…px]` et `min-w-[…px]` : ce sont les deux seules qui
 * FORCENT une largeur. `max-w-[…px]` est un plafond — il autorise l'élément à
 * rétrécir, donc il ne déborde pas. Confondre les deux ferait rejeter la mise
 * en page centrée la plus banale du projet.
 */
export function findFixedWidths(source: string, limit = USABLE_WIDTH): FixedWidth[] {
  const found: FixedWidth[] = []

  source.split('\n').forEach((text, index) => {
    /* `(?<![\w-])` empêche `max-w-[…]` de correspondre par sa fin : sans cette
       garde, tout plafond serait signalé comme une largeur imposée. */
    const matches = text.matchAll(/(?<![\w-])(min-w|w)-\[(\d+)px\]/g)
    for (const match of matches) {
      const px = Number(match[2])
      if (px > limit) {
        found.push({ className: match[0], px, line: index + 1 })
      }
    }
  })

  return found
}
