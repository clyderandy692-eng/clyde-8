import type { Block, BlockType } from './types'

export function updateEditorBlock(
  blocks: Block[],
  id: string,
  patch: Partial<Block>,
): Block[] {
  return blocks.map((block) =>
    block.id === id ? ({ ...block, ...patch } as Block) : block,
  )
}

export function moveEditorBlock(
  blocks: Block[],
  id: string,
  direction: -1 | 1,
): Block[] {
  const index = blocks.findIndex((block) => block.id === id)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return blocks

  const next = [...blocks]
  ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
  return next
}

export function reorderEditorBlock(
  blocks: Block[],
  activeId: string,
  overId: string,
): Block[] {
  const oldIndex = blocks.findIndex((block) => block.id === activeId)
  const newIndex = blocks.findIndex((block) => block.id === overId)
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return blocks

  const next = [...blocks]
  const [moved] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, moved)
  return next
}

export function removeEditorBlock(blocks: Block[], id: string): Block[] {
  return blocks.filter((block) => block.id !== id)
}

export function duplicateEditorBlock(
  blocks: Block[],
  id: string,
  createId: () => string = () => crypto.randomUUID(),
): Block[] {
  const index = blocks.findIndex((block) => block.id === id)
  if (index < 0) return blocks

  const duplicate = structuredClone(blocks[index])
  duplicate.id = createId()

  const next = [...blocks]
  next.splice(index + 1, 0, duplicate)
  return next
}

export function canAddEditorBlock(
  blocks: Block[],
  type: BlockType,
  uniqueTypes: ReadonlySet<BlockType>,
): boolean {
  return !uniqueTypes.has(type) || !blocks.some((block) => block.type === type)
}

export interface EditorHistory {
  past: Block[][]
  present: Block[]
  future: Block[][]
}

export function commitEditorHistory(
  history: EditorHistory,
  next: Block[],
  limit = 50,
): EditorHistory {
  return {
    past: [...history.past, history.present].slice(-limit),
    present: next,
    future: [],
  }
}

export function undoEditorHistory(history: EditorHistory): EditorHistory {
  if (history.past.length === 0) return history
  const previous = history.past.at(-1)!
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redoEditorHistory(history: EditorHistory): EditorHistory {
  if (history.future.length === 0) return history
  const [next, ...future] = history.future
  return {
    past: [...history.past, history.present],
    present: next,
    future,
  }
}
