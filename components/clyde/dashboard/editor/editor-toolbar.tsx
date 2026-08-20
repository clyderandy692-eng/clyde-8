'use client'

import { Circle, Eye, Redo2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EditorToolbar({
  dirty,
  canUndo,
  canRedo,
  undoLabel,
  redoLabel,
  publicPageLabel,
  publicPageUrl,
  onUndo,
  onRedo,
}: {
  dirty: boolean
  canUndo: boolean
  canRedo: boolean
  undoLabel: string
  redoLabel: string
  publicPageLabel: string
  publicPageUrl: string
  onUndo: () => void
  onRedo: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" role="status" aria-live="polite">
        <Circle className={dirty ? 'size-2 fill-brand text-brand' : 'size-2 fill-muted-foreground/50 text-muted-foreground/50'} aria-hidden="true" />
        {dirty ? 'Modifications en cours…' : 'Enregistré'}
      </span>
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={undoLabel}
          title={`${undoLabel} (Ctrl+Z)`}
          className="flex size-9 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Undo2 className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label={redoLabel}
          title={`${redoLabel} (Ctrl+Shift+Z)`}
          className="flex size-9 items-center justify-center rounded-r-lg border-l border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <Redo2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <Button variant="outline" onClick={() => window.open(publicPageUrl, '_blank', 'noopener,noreferrer')}>
        <Eye data-icon="inline-start" />
        <span className="hidden sm:inline">{publicPageLabel}</span>
        <span className="sr-only sm:hidden">{publicPageLabel}</span>
      </Button>
    </div>
  )
}
