import { beforeEach, describe, expect, it, vi } from 'vitest'
import { persistedSessions, useEditorSession } from '../editor-session'
import type { Block } from '../types'

const first = [{ id: 'hero-1', type: 'hero' }] as Block[]
const second = [{ id: 'hero-1', type: 'hero', title: 'Nouveau titre' }] as Block[]

beforeEach(() => {
  useEditorSession.setState({ sessions: {} })
  vi.useRealTimers()
})

describe('editor session history', () => {
  it('conserve l’historique lors d’un remontage du constructeur', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.commit('business-1', first, second)

    expect(useEditorSession.getState().undo('business-1', second)).toEqual(first)
    expect(useEditorSession.getState().redo('business-1', first)).toEqual(second)
  })

  it('regroupe les frappes rapprochées d’un même champ', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T10:00:00Z'))
    const session = useEditorSession.getState()
    const third = [{ id: 'hero-1', type: 'hero', title: 'Nouveau titre complet' }] as Block[]
    session.ensure('business-1', first)
    session.commit('business-1', first, second, 'hero-1:title')
    vi.advanceTimersByTime(300)
    session.commit('business-1', second, third, 'hero-1:title')

    expect(useEditorSession.getState().sessions['business-1'].past).toHaveLength(1)
  })

  it('redevient enregistré quand une annulation retrouve la référence', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.commit('business-1', first, second)

    expect(useEditorSession.getState().sessions['business-1'].dirty).toBe(true)
    expect(useEditorSession.getState().undo('business-1', second)).toEqual(first)
    expect(useEditorSession.getState().sessions['business-1'].dirty).toBe(false)
    expect(useEditorSession.getState().redo('business-1', first)).toEqual(second)
    expect(useEditorSession.getState().sessions['business-1'].dirty).toBe(true)
  })

  it('déplace la référence après une écriture réellement vérifiée', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.commit('business-1', first, second)
    session.markSaved('business-1', second)

    expect(useEditorSession.getState().sessions['business-1'].dirty).toBe(false)
    expect(useEditorSession.getState().undo('business-1', second)).toEqual(first)
    expect(useEditorSession.getState().sessions['business-1'].dirty).toBe(true)
    expect(useEditorSession.getState().redo('business-1', first)).toEqual(second)
    expect(useEditorSession.getState().sessions['business-1'].dirty).toBe(false)
  })

  it('isole les historiques de deux commerces', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.ensure('business-2', first)
    session.commit('business-1', first, second)

    expect(useEditorSession.getState().sessions['business-1'].past).toHaveLength(1)
    expect(useEditorSession.getState().sessions['business-2'].past).toHaveLength(0)
  })
})

describe('reset — abandon d’un brouillon', () => {
  it('repart d’un historique vide sur la mise en page conservée', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.commit('business-1', first, second)
    session.reset('business-1', first)

    const entry = useEditorSession.getState().sessions['business-1']
    expect(entry.past).toHaveLength(0)
    expect(entry.future).toHaveLength(0)
    /* La page conservée EST la référence : rien ne reste à enregistrer. */
    expect(entry.dirty).toBe(false)
  })

  /* Régression : c'est la raison d'être de `reset`. Les états d'historique
     décrivent le brouillon qu'on vient de jeter ; si « Annuler » restait
     praticable, il ferait revenir à l'écran ce que le commerçant venait
     explicitement d'abandonner — l'inverse exact de ce qu'il a demandé. */
  it('rend l’annulation impraticable après l’abandon', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.commit('business-1', first, second)
    session.reset('business-1', first)

    expect(useEditorSession.getState().undo('business-1', first)).toBeNull()
    expect(useEditorSession.getState().redo('business-1', first)).toBeNull()
  })

  /* Régression : l'abandon d'un brouillon ne concerne qu'un commerce. Un
     `reset` qui remettrait à zéro `sessions` entier ferait perdre son
     historique au commerce voisin ouvert dans un autre onglet. */
  it('ne touche pas à l’historique d’un autre commerce', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.ensure('business-2', first)
    session.commit('business-2', first, second)
    session.reset('business-1', first)

    expect(useEditorSession.getState().sessions['business-2'].past).toHaveLength(1)
  })
})

/* On interroge la règle de découpage elle-même au lieu de relire
   `localStorage` : cette suite tourne en environnement `node` (voir
   `vitest.config.ts`), et sans stockage le middleware `persist` ne s'installe
   pas — passer par `useEditorSession.persist` n'aurait rien à interroger. */
describe('tranche d’historique retenue pour le disque', () => {
  const persistedPast = (businessId: string): Block[][] =>
    persistedSessions(useEditorSession.getState()).sessions[businessId].past

  /* Un pas d'historique est une mise en page ENTIÈRE, pas une opération. Ce que
     l'on écrit doit donc rester court : le stockage est partagé avec le
     registre `clyde-data`, et si le quota casse, le premier sacrifié serait le
     travail du commerçant, pas son historique. */
  it('n’écrit qu’une tranche courte de l’historique', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    for (let i = 0; i < 30; i += 1) {
      session.commit('business-1', first, second)
    }

    expect(useEditorSession.getState().sessions['business-1'].past.length)
      .toBeGreaterThan(12)
    expect(persistedPast('business-1').length).toBeLessThanOrEqual(12)
  })

  /* Régression : ce qui est le plus proche du présent est ce qu'on voudra
     défaire en premier. Retenir le DÉBUT de `past` garderait les pas les plus
     anciens et jetterait le geste que le commerçant vient de faire. */
  it('conserve les pas les plus récents, pas les plus anciens', () => {
    const session = useEditorSession.getState()
    const etat = (n: number) =>
      [{ id: 'hero-1', type: 'hero', title: `titre ${n}` }] as Block[]
    session.ensure('business-1', etat(0))
    for (let i = 0; i < 20; i += 1) {
      session.commit('business-1', etat(i), etat(i + 1))
    }

    expect(persistedPast('business-1').at(-1)).toEqual(etat(19))
  })

  /* Régression : `lastGroup` et `lastCommitAt` fondent en un seul pas des
     gestes rapprochés. Les laisser survivre au rechargement ferait fusionner la
     première modification d'une visite avec la dernière de la précédente. */
  it('ne fait pas survivre le regroupement de saisie', () => {
    const session = useEditorSession.getState()
    session.ensure('business-1', first)
    session.commit('business-1', first, second, 'hero-1:title')

    const retenu = persistedSessions(useEditorSession.getState()).sessions['business-1']

    expect(retenu.lastGroup).toBeNull()
    expect(retenu.lastCommitAt).toBe(0)
  })
})
