'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  dropStaleHistory: (businessId: string, currentLayout: Block[]) => void
  commit: (businessId: string, previous: Block[], next: Block[], group?: string) => void
  undo: (businessId: string, current: Block[]) => Block[] | null
  redo: (businessId: string, current: Block[]) => Block[] | null
  markSaved: (businessId: string, current: Block[]) => void
  /**
   * Repart d'un historique vide sur la mise en page donnée.
   *
   * Pour l'abandon d'un brouillon : les états conservés décrivent le brouillon
   * qu'on vient de jeter, et les rejouer ferait revenir ce que le commerçant
   * venait explicitement d'abandonner.
   */
  reset: (businessId: string, layout: Block[]) => void
}

const EMPTY: HistoryEntry = {
  past: [],
  future: [],
  dirty: false,
  savedHash: null,
  lastGroup: null,
  lastCommitAt: 0,
}

/**
 * Profondeur d'historique conservée EN MÉMOIRE pendant la session.
 */
const MEMORY_DEPTH = 49

/**
 * Profondeur d'historique réellement écrite sur le disque.
 *
 * Volontairement plus courte que celle en mémoire : un pas d'historique est une
 * mise en page entière, pas une opération. Persister les 50 pas d'une session
 * chargée écrirait plusieurs centaines de kilo-octets à côté du registre
 * `clyde-data`, dans un stockage dont ce même module prouve déjà qu'il peut
 * refuser une écriture (voir `layoutPersisted`) — et le premier sacrifié serait
 * le travail du commerçant, pas son historique.
 *
 * Douze pas couvrent la maladresse qu'on veut réparer après un rechargement.
 * Au-delà, ce n'est plus un retour en arrière, c'est une autre version de la
 * page — et c'est le rôle du brouillon, pas celui de l'annulation.
 */
const PERSISTED_DEPTH = 12

function layoutHash(layout: Block[]): string {
  return JSON.stringify(layout)
}

/**
 * Historique du constructeur, conservé d'une visite à l'autre.
 *
 * L'historique vivait en mémoire seule : un rechargement laissait « Annuler »
 * et « Rétablir » tous deux inactifs, et un bloc supprimé juste avant était
 * définitivement perdu. L'enregistrement automatique protégeait le contenu,
 * rien ne protégeait le retour en arrière — c'est-à-dire précisément le moment
 * où le commerçant a besoin d'être protégé.
 *
 * `skipHydration` comme le registre principal : lire le stockage pendant le
 * rendu ferait diverger serveur et client. On réhydrate après montage, via
 * `useEditorSessionReady`, qui doit être attendu AVANT le premier `ensure` —
 * sinon `ensure` fabriquerait une session vide que la réhydratation viendrait
 * écraser, ou l'inverse selon l'ordre des effets.
 */
export const useEditorSession = create<EditorSessionState>()(
  persist(
    (set, get) => ({
      sessions: {},
      ensure: (businessId, initial) => set((state) => state.sessions[businessId]
        ? state
        : {
            sessions: {
              ...state.sessions,
              [businessId]: { ...EMPTY, savedHash: layoutHash(initial) },
            },
          }),
      reset: (businessId, layout) => set((state) => ({
        sessions: {
          ...state.sessions,
          [businessId]: { ...EMPTY, savedHash: layoutHash(layout) },
        },
      })),
      /**
       * Écarte un historique relu qui ne raconte plus la page affichée.
       *
       * Une session réhydratée ne vaut que pour la mise en page qu'elle a vue
       * partir. Si la page a changé sous elle — modifiée dans un autre onglet,
       * ou resemée par une rupture de version des données de démonstration —
       * sa lignée ne mène plus à l'état affiché : annuler ferait surgir une
       * page venue d'une autre histoire. Perdre l'historique est alors le
       * moindre mal.
       *
       * À n'appeler qu'une fois, juste après la relecture du stockage. Appelée
       * à chaque modification, cette comparaison serait toujours fausse
       * pendant la frappe — `savedHash` désigne le dernier état ENREGISTRÉ —
       * et effacerait l'historique au premier caractère tapé.
       */
      dropStaleHistory: (businessId, currentLayout) => set((state) => {
        const existing = state.sessions[businessId]
        if (!existing || existing.savedHash === layoutHash(currentLayout)) return state
        return {
          sessions: {
            ...state.sessions,
            [businessId]: { ...EMPTY, savedHash: layoutHash(currentLayout) },
          },
        }
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
              past: grouped ? current.past : [...current.past.slice(-MEMORY_DEPTH), previous],
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
    }),
    {
      name: 'clyde-editor-history',
      skipHydration: true,
      version: 1,
      /* On ne persiste que l'historique, écourté, et on remet à zéro ce qui
         n'a de sens que dans la session en cours : `lastGroup` et
         `lastCommitAt` servent à fondre en un seul pas des gestes rapprochés
         (un glissement de curseur). Les faire survivre au rechargement ferait
         fusionner la première modification d'une visite avec la dernière de la
         précédente. Ils sont donc réécrits explicitement plutôt qu'omis, pour
         que chaque entrée relue reste une `HistoryEntry` complète. */
      partialize: (state) => ({
        sessions: Object.fromEntries(
          Object.entries(state.sessions).map(([id, entry]) => [
            id,
            {
              /* `past` garde sa fin (les pas les plus récents) et `future` son
                 début : dans les deux cas, ce qui est le plus proche du présent
                 est ce qu'on voudra défaire ou refaire en premier. */
              past: entry.past.slice(-PERSISTED_DEPTH),
              future: entry.future.slice(0, PERSISTED_DEPTH),
              dirty: entry.dirty,
              savedHash: entry.savedHash,
              lastGroup: null,
              lastCommitAt: 0,
            },
          ]),
        ),
      }),
    },
  ),
)

/**
 * Attend la relecture de l'historique enregistré.
 *
 * Renvoie `false` au premier rendu, puis `true` une fois le stockage lu. Le
 * constructeur doit attendre ce `true` avant d'appeler `ensure`, sous peine de
 * déclarer une session neuve sur une page dont l'historique existait.
 */
export function useEditorSessionReady(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (useEditorSession.persist.hasHydrated()) {
      setReady(true)
      return
    }
    const done = useEditorSession.persist.onFinishHydration(() => setReady(true))
    void useEditorSession.persist.rehydrate()
    return done
  }, [])
  return ready
}

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
 *
 * `draft_layout_json` d'abord : c'est ce que le constructeur modifie. On
 * retombe sur `layout_json` quand aucun brouillon n'est ouvert, sans quoi
 * l'indicateur resterait bloqué sur « Modifications en cours » pour une page
 * sans brouillon — l'écriture aurait bien eu lieu, à l'endroit qu'on ne
 * regardait pas.
 */
export function layoutPersisted(businessId: string, blocks: Block[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return false
    const snapshot = JSON.parse(raw) as {
      state?: {
        pages?: Array<{
          business_id: string
          layout_json: Block[]
          draft_layout_json?: Block[] | null
        }>
      }
    }
    const page = snapshot.state?.pages?.find((p) => p.business_id === businessId)
    if (!page) return false
    const stored = page.draft_layout_json ?? page.layout_json
    return JSON.stringify(stored) === JSON.stringify(blocks)
  } catch {
    /* Instantané illisible ou stockage inaccessible : dans le doute, on ne
       promet rien au commerçant. */
    return false
  }
}
