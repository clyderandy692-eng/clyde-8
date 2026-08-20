import { describe, expect, it } from 'vitest'
import { CATEGORIES, CATEGORY_MAP, ITEM_WORDS } from '../taxonomy'

/*
 * L'exhaustivité des vingt-trois catégories est déjà garantie par le type
 * `Record<BusinessCategory, ItemWords>` : oublier une catégorie ne compile pas.
 * Ces tests portent donc sur ce que le compilateur ne peut pas voir — le sens
 * des mots eux-mêmes.
 */
describe('noms des entrées du catalogue', () => {
  it('ne confond jamais l’entrée avec le contenant', () => {
    /*
     * C'est le bug d'origine : les écrans passaient `catalogWord` là où il
     * fallait le nom d'une entrée, ce qui donnait « ces clients ont choisi
     * leurs menu ». Un mot d'entrée identique au nom du catalogue signalerait
     * que la distinction s'est reperdue.
     */
    for (const meta of CATEGORIES) {
      const item = ITEM_WORDS[meta.id]
      expect(
        item.singular.toLowerCase(),
        `${meta.id} : « ${item.singular} » nomme aussi le catalogue`,
      ).not.toBe(meta.catalogWord.toLowerCase())
    }
  })

  it('distingue le singulier du pluriel dans les deux cas', () => {
    /* « leurs Plat » et « 1 Plats » sont aussi fautifs l'un que l'autre : les
       deux formes servent dans des phrases différentes et doivent différer. */
    for (const meta of CATEGORIES) {
      const { singular, plural } = ITEM_WORDS[meta.id]
      expect(singular.length, `${meta.id} : singulier vide`).toBeGreaterThan(0)
      expect(plural, `${meta.id} : pluriel identique au singulier`).not.toBe(
        singular,
      )
    }
  })

  it('donne au restaurant le mot de son métier, pas un terme générique', () => {
    /*
     * Un cas nominal explicite : la promesse du produit est qu'un restaurateur
     * lise « Plat » et un hôtelier « Chambre ». Sans cet ancrage, la table
     * pourrait retomber sur « Article » partout sans qu'aucun test ne bronche,
     * puisque les invariants ci-dessus resteraient satisfaits.
     */
    expect(ITEM_WORDS.restaurant.singular).toBe('Plat')
    expect(ITEM_WORDS.hotel.singular).toBe('Chambre')
    expect(ITEM_WORDS.coiffure_beaute.singular).toBe('Prestation')
  })

  it('couvre toute catégorie atteignable depuis la taxonomie', () => {
    /* Garde-fou sur la cohérence des deux structures : `CATEGORIES` est un
       tableau, `ITEM_WORDS` un dictionnaire. Le type les relie, mais une
       catégorie retirée du tableau sans l'être du type passerait inaperçue. */
    for (const meta of CATEGORIES) {
      expect(ITEM_WORDS[meta.id], `${meta.id} absente`).toBeDefined()
      expect(CATEGORY_MAP[meta.id]).toBeDefined()
    }
  })
})
