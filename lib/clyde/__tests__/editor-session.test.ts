import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEditorSession } from '../editor-session'
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
