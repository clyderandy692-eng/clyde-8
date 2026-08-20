import { describe, expect, it } from 'vitest'
import {
  canAddEditorBlock,
  commitEditorHistory,
  moveEditorBlock,
  redoEditorHistory,
  removeEditorBlock,
  reorderEditorBlock,
  undoEditorHistory,
  updateEditorBlock,
  type EditorHistory,
} from '../editor-layout'
import { createBlock } from '../blocks'
import type { Block, BlockType } from '../types'

function blocks(): Block[] {
  return [createBlock('hero'), createBlock('catalogue'), createBlock('contact')]
}

describe('structure du constructeur de pages', () => {
  it('ajoute un bloc sans modifier la liste précédente', () => {
    const initial = blocks()
    const next = [...initial, createBlock('reviews')]

    expect(initial).toHaveLength(3)
    expect(next).toHaveLength(4)
    expect(next.at(-1)?.type).toBe('reviews')
  })

  it('déplace un bloc avec les commandes accessibles', () => {
    const initial = blocks()
    const next = moveEditorBlock(initial, initial[1].id, -1)

    expect(next.map((block) => block.type)).toEqual(['catalogue', 'hero', 'contact'])
    expect(initial.map((block) => block.type)).toEqual(['hero', 'catalogue', 'contact'])
  })

  it('réordonne un bloc par glisser-déposer', () => {
    const initial = blocks()
    const next = reorderEditorBlock(initial, initial[0].id, initial[2].id)

    expect(next.map((block) => block.type)).toEqual(['catalogue', 'contact', 'hero'])
  })

  it('supprime uniquement le bloc demandé', () => {
    const initial = blocks()
    const next = removeEditorBlock(initial, initial[1].id)

    expect(next.map((block) => block.type)).toEqual(['hero', 'contact'])
  })

  it('met à jour un bloc sans muter son état précédent', () => {
    const initial = blocks()
    const next = updateEditorBlock(initial, initial[0].id, { hidden: true })

    expect(next[0].hidden).toBe(true)
    expect(initial[0].hidden).toBeUndefined()
  })

  it('interdit le doublon d’un bloc unique', () => {
    const initial = blocks()
    const uniqueTypes = new Set<BlockType>(['hero', 'catalogue'])

    expect(canAddEditorBlock(initial, 'hero', uniqueTypes)).toBe(false)
    expect(canAddEditorBlock(initial, 'reviews', uniqueTypes)).toBe(true)
  })
})

describe('historique du constructeur de pages', () => {
  it('annule puis rétablit un changement', () => {
    const initial = blocks()
    const changed = removeEditorBlock(initial, initial[1].id)
    const history: EditorHistory = { past: [], present: initial, future: [] }

    const committed = commitEditorHistory(history, changed)
    const undone = undoEditorHistory(committed)
    const redone = redoEditorHistory(undone)

    expect(undone.present.map((block) => block.type)).toEqual(['hero', 'catalogue', 'contact'])
    expect(redone.present.map((block) => block.type)).toEqual(['hero', 'contact'])
  })

  it('efface le futur après une nouvelle branche', () => {
    const initial = blocks()
    const changed = removeEditorBlock(initial, initial[1].id)
    const history = commitEditorHistory({ past: [], present: initial, future: [] }, changed)
    const undone = undoEditorHistory(history)
    const branched = commitEditorHistory(undone, moveEditorBlock(undone.present, initial[2].id, -1))

    expect(branched.future).toEqual([])
  })

  it('limite la profondeur de l’historique', () => {
    let history: EditorHistory = { past: [], present: blocks(), future: [] }
    for (let index = 0; index < 60; index += 1) {
      history = commitEditorHistory(history, updateEditorBlock(history.present, history.present[0].id, { hidden: index % 2 === 0 }))
    }

    expect(history.past).toHaveLength(50)
  })
})
