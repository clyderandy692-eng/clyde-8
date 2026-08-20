import { describe, expect, it } from 'vitest'
import {
  ACTIVATION_MIN_PRODUCTS,
  ACTIVATION_QR_KEY,
  ACTIVATION_SHARE_KEY,
  ACTIVATION_WELCOME_KEY,
  activationKey,
  activationProgress,
  countProductsWithoutPhoto,
  nextVendorAction,
} from '../activation'

const BUSINESS = 'biz-1'

function progress(over: Partial<Parameters<typeof activationProgress>[0]> = {}) {
  return activationProgress({
    businessId: BUSINESS,
    productCount: 0,
    published: false,
    checks: [],
    ...over,
  })
}

describe('progression de l’activation', () => {
  it('ne franchit rien sur un commerce vide', () => {
    const state = progress()

    expect(state.doneCount).toBe(0)
    expect(state.allDone).toBe(false)
  })

  it('franchit les quatre étapes et se déclare terminée', () => {
    const state = progress({
      productCount: ACTIVATION_MIN_PRODUCTS,
      published: true,
      checks: [
        activationKey(BUSINESS, ACTIVATION_QR_KEY),
        activationKey(BUSINESS, ACTIVATION_SHARE_KEY),
      ],
    })

    expect(state.doneCount).toBe(4)
    expect(state.allDone).toBe(true)
  })

  it('exige le seuil complet : deux articles ne suffisent pas', () => {
    expect(progress({ productCount: ACTIVATION_MIN_PRODUCTS - 1 }).itemsDone).toBe(
      false,
    )
    expect(progress({ productCount: ACTIVATION_MIN_PRODUCTS }).itemsDone).toBe(true)
  })

  /* Régression : les constats sont stockés à plat dans une seule liste. Sans le
     préfixe du commerce, le QR téléchargé par une boutique cochait l'étape de
     toutes les autres boutiques du même compte. */
  it('n’attribue pas le constat d’un commerce à un autre', () => {
    const state = progress({
      checks: [activationKey('autre-commerce', ACTIVATION_QR_KEY)],
    })

    expect(state.qrDone).toBe(false)
  })

  /* Régression : l'accueil de premier lancement partage le stock de constats.
     S'il portait la même clé qu'une étape, le montrer aurait coché l'étape. */
  it('garde la clé de bienvenue distincte des étapes', () => {
    const keys = [ACTIVATION_QR_KEY, ACTIVATION_SHARE_KEY]

    expect(keys).not.toContain(ACTIVATION_WELCOME_KEY)

    const state = progress({
      checks: [activationKey(BUSINESS, ACTIVATION_WELCOME_KEY)],
    })

    expect(state.doneCount).toBe(0)
  })
})

describe('prochaine action utile', () => {
  it('renvoie aux statistiques quand rien ne réclame la main', () => {
    const action = nextVendorAction({
      pendingOrderCount: 0,
      productsWithoutPhoto: 0,
    })

    expect(action.kind).toBe('analytics')
  })

  it('renvoie aux commandes dès qu’un client attend', () => {
    const action = nextVendorAction({
      pendingOrderCount: 3,
      productsWithoutPhoto: 0,
    })

    expect(action).toMatchObject({ kind: 'orders', count: 3 })
  })

  it('renvoie au catalogue quand seules des photos manquent', () => {
    const action = nextVendorAction({
      pendingOrderCount: 0,
      productsWithoutPhoto: 2,
    })

    expect(action).toMatchObject({ kind: 'photos', count: 2 })
  })

  /* Régression : l'urgence l'emporte. Un client qui patiente maintenant passe
     avant une photo qui améliorera une vente future. */
  it('sert la commande en attente avant la photo manquante', () => {
    const action = nextVendorAction({
      pendingOrderCount: 1,
      productsWithoutPhoto: 9,
    })

    expect(action.kind).toBe('orders')
  })
})

describe('articles sans visuel', () => {
  it('compte les articles dont la galerie est vide', () => {
    const count = countProductsWithoutPhoto([
      { media_urls: [] },
      { media_urls: ['/images/pain.png'] },
    ])

    expect(count).toBe(1)
  })

  /* Régression : un téléversement interrompu laisse une entrée vide. La galerie
     n'est pas vide, mais l'article n'a toujours pas de photo. */
  it('traite une entrée vide comme une absence de photo', () => {
    expect(countProductsWithoutPhoto([{ media_urls: ['', '   '] }])).toBe(1)
    expect(countProductsWithoutPhoto([{ media_urls: ['', '/a.png'] }])).toBe(0)
  })
})
