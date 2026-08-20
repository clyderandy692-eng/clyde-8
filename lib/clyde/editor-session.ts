'use client'

import { create } from 'zustand'
import type { Block } from './types'

type HistoryEntry = {
  past: Block[][]
  future: Block[][]
  dirty: boolean
  /** Empreinte du dernier état dont l’écriture a été réellement vérifiée. */
  savedHash: string | null
  lastGroup: string | null
  lastCommitAt: number
}

type EditorSessionState = {
  sessions: Record<string, HistoryEntry>
  ensure: (businessId: string, initial: Block[]) => void
  commit: (businessId: string, previous: Block[], next: Block[], group?: string) => void
  undo: (businessId: string, current: Block[]) => Block[] | null
  redo: (businessId: string, current: Block[]) => Block[] | null
  markSaved: (businessId: string, current: Block[]) => void
}

const EMPTY: HistoryEntry = {
  past: [],
  future: [],
  dirty: false,
  savedHash: null,
  lastGroup: null,
  lastCommitAt: 0,
}

function layoutHash(layout: Block[]): string {
  return JSON.stringify(layout)
}

export const useEditorSession = create<EditorSessionState>((set, get) => ({
  sessions: {},
  ensure: (businessId, initial) => set((state) => state.sessions[businessId]
    ? state
    : {
        sessions: {
          ...state.sessions,
          [businessId]: { ...EMPTY, savedHash: layoutHash(initial) },
        },
      }),
  commit: (businessId, previous, next, group) => set((state) => {
    const current = state.sessions[businessId] ?? {
      ...EMPTY,
      savedHash: layoutHash(previous),
    }
    const now = Date.now()
    const grouped = Boolean(group && current.lastGroup === group && now - current.lastCommitAt < 700)
    return {
      sessions: {
        ...state.sessions,
        [businessId]: {
          past: grouped ? current.past : [...current.past.slice(-49), previous],
          future: [],
          dirty: layoutHash(next) !== current.savedHash,
          savedHash: current.savedHash,
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
          dirty: layoutHash(previous) !== session.savedHash,
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
          dirty: layoutHash(next) !== session.savedHash,
          lastGroup: null,
        },
      },
    }))
    return next
  },
  markSaved: (businessId, current) => set((state) => ({
    sessions: {
      ...state.sessions,
      [businessId]: {
        ...(state.sessions[businessId] ?? EMPTY),
        dirty: false,
        savedHash: layoutHash(current),
        lastGroup: null,
      },
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
