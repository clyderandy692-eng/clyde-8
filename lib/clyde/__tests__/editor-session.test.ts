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
    session.ensure('business-1')
    session.commit('business-1', first)

    expect(useEditorSession.getState().undo('business-1', second)).toEqual(first)
    expect(useEditorSession.getState().redo('business-1', first)).toEqual(second)
  })

  it('regroupe les frappes rapprochées d’un même champ', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-20T10:00:00Z'))
    const session = useEditorSession.getState()
    session.ensure('business-1')
    session.commit('business-1', first, 'hero-1:title')
    vi.advanceTimersByTime(300)
    session.commit('business-1', second, 'hero-1:title')

    expect(useEditorSession.getState().sessions['business-1'].past).toHaveLength(1)
  })
})
