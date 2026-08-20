'use client'

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableBlockRow({
  id,
  children,
}: {
  id: string
  children: (args: { handleProps: Record<string, unknown> }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10 rounded-lg bg-background opacity-90 shadow-lg' : undefined}
    >
      {children({ handleProps: { ...attributes, ...listeners, ref: setActivatorNodeRef } })}
    </div>
  )
}
