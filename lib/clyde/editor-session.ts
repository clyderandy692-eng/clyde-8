'use client'

import { create } from 'zustand'
import type { Block } from './types'

type HistoryEntry = {
  past: Block[][]
  future: Block[][]
  dirty: boolean
  lastGroup: string | null
  lastCommitAt: number
}

type EditorSessionState = {
  sessions: Record<string, HistoryEntry>
  ensure: (businessId: string) => void
  commit: (businessId: string, previous: Block[], group?: string) => void
  undo: (businessId: string, current: Block[]) => Block[] | null
  redo: (businessId: string, current: Block[]) => Block[] | null
  markSaved: (businessId: string) => void
}

const EMPTY: HistoryEntry = {
  past: [],
  future: [],
  dirty: false,
  lastGroup: null,
  lastCommitAt: 0,
}

export const useEditorSession = create<EditorSessionState>((set, get) => ({
  sessions: {},
  ensure: (businessId) => set((state) => state.sessions[businessId]
    ? state
    : { sessions: { ...state.sessions, [businessId]: { ...EMPTY } } }),
  commit: (businessId, previous, group) => set((state) => {
    const current = state.sessions[businessId] ?? EMPTY
    const now = Date.now()
    const grouped = Boolean(group && current.lastGroup === group && now - current.lastCommitAt < 700)
    return {
      sessions: {
        ...state.sessions,
        [businessId]: {
          past: grouped ? current.past : [...current.past.slice(-49), previous],
          future: [],
          dirty: true,
          lastGroup: group ?? null,
          lastCommitAt: now,
        },
      },
    }
  }),
  undo: (businessId, currentLayout) => {
    const session = get().sessions[businessId] ?? EMPTY
    const previous = session.past.at(-1)
    if (!previous) return null
    set((state) => ({
      sessions: {
        ...state.sessions,
        [businessId]: {
          ...session,
          past: session.past.slice(0, -1),
          future: [currentLayout, ...session.future],
          dirty: true,
          lastGroup: null,
        },
      },
    }))
    return previous
  },
  redo: (businessId, currentLayout) => {
    const session = get().sessions[businessId] ?? EMPTY
    const next = session.future[0]
    if (!next) return null
    set((state) => ({
      sessions: {
        ...state.sessions,
        [businessId]: {
          ...session,
          past: [...session.past, currentLayout],
          future: session.future.slice(1),
          dirty: true,
          lastGroup: null,
        },
      },
    }))
    return next
  },
  markSaved: (businessId) => set((state) => ({
    sessions: {
      ...state.sessions,
      [businessId]: { ...(state.sessions[businessId] ?? EMPTY), dirty: false, lastGroup: null },
    },
  })),
}))

/** Clé sous laquelle le registre CLYDE écrit son instantané. */
const SNAPSHOT_KEY = 'clyde-data'

/**
 * La mise en page est-elle réellement dans l'instantané enregistré ?
 *
 * Le constructeur affichait « Enregistré » au bout d'un délai fixe, sans rien
 * vérifier : un quota de stockage dépassé ou une écriture refusée en navigation
 * privée laissait le commerçant croire que son travail était à l'abri. On relit
 * donc ce qui est réellement sur le disque et on le compare à l'écran.
 *
 * La comparaison passe par `JSON.stringify` : c'est exactement la forme que
 * prend la mise en page une fois enregistrée, donc la seule qui répond à la
 * question posée — deux objets égaux au sens du sérialiseur sont indiscernables
 * après un rechargement.
 */
export function layoutPersisted(businessId: string, blocks: Block[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return false
    const snapshot = JSON.parse(raw) as {
      state?: { pages?: Array<{ business_id: string; layout_json: Block[] }> }
    }
    const page = snapshot.state?.pages?.find((p) => p.business_id === businessId)
    if (!page) return false
    return JSON.stringify(page.layout_json) === JSON.stringify(blocks)
  } catch {
    /* Instantané illisible ou stockage inaccessible : dans le doute, on ne
       promet rien au commerçant. */
    return false
  }
}
