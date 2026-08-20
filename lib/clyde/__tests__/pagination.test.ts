import { describe, expect, it } from 'vitest'
import { DEFAULT_PAGE_SIZE, pageSlice } from '../pagination'

const list = (size: number) => Array.from({ length: size }, (_, i) => i)

describe('affichage progressif des longues listes', () => {
  it('ne rend qu’une page et annonce le reste', () => {
    const page = pageSlice(list(50), DEFAULT_PAGE_SIZE)

    expect(page.items).toHaveLength(DEFAULT_PAGE_SIZE)
    expect(page.hasMore).toBe(true)
    expect(page.remaining).toBe(30)
  })

  it('rend tout sans bouton quand la liste tient sur une page', () => {
    const page = pageSlice(list(7))

    expect(page.items).toHaveLength(7)
    expect(page.hasMore).toBe(false)
    expect(page.remaining).toBe(0)
  })

  it('ne propose rien sur une liste vide', () => {
    const page = pageSlice([])

    expect(page.items).toEqual([])
    expect(page.hasMore).toBe(false)
    expect(page.nextCount).toBe(0)
  })

  it('révèle la suite page par page', () => {
    const items = list(45)
    const first = pageSlice(items, DEFAULT_PAGE_SIZE)
    const second = pageSlice(items, first.nextCount)
    const third = pageSlice(items, second.nextCount)

    expect(second.items).toHaveLength(40)
    expect(third.items).toHaveLength(45)
    expect(third.hasMore).toBe(false)
  })

  /* Régression : le compteur n'était pas borné. Après le dernier élément,
     `nextCount` continuait de grandir et le bouton « voir plus » restait
     affiché en ne chargeant plus rien. */
  it('ne laisse pas le compteur dépasser la liste', () => {
    const page = pageSlice(list(12), 900)

    expect(page.items).toHaveLength(12)
    expect(page.hasMore).toBe(false)
    expect(page.nextCount).toBe(12)
  })

  /* Régression : changer de filtre remet le compteur à zéro. Un zéro brut
     affichait une liste vide alors que des commandes correspondaient. */
  it('affiche au moins une page même si le compteur est absurde', () => {
    for (const count of [0, -5, Number.NaN, 3.4]) {
      expect(pageSlice(list(30), count).items).toHaveLength(DEFAULT_PAGE_SIZE)
    }
  })

  it('respecte une taille de page choisie, sans accepter zéro', () => {
    expect(pageSlice(list(30), 5, 5).items).toHaveLength(5)
    expect(pageSlice(list(30), 0, 0).items).toHaveLength(DEFAULT_PAGE_SIZE)
  })
})
