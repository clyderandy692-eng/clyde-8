'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { controlSurface, readableOn } from '@/lib/clyde/theme'
import { Shell, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 2 — Barre de recherche et filtres. */

export function SearchRender({ block, ctx }: { block: Extract<Block, { type: 'search' }>; ctx: RenderCtx }) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const categories = useMemo(
    () => Array.from(new Set(ctx.products.map((p) => p.category_label).filter(Boolean))) as string[],
    [ctx.products],
  )

  return (
    <Shell block={block} ctx={ctx} className={filtersOpen ? 'relative z-[60]' : undefined}>
      <div className="relative flex items-center gap-2">
        <div
          className="flex min-w-0 flex-1 items-center gap-2 px-3.5"
          style={controlSurface(ctx.theme)}
        >
          <Search size={16} className="shrink-0 opacity-45" />
          <input
            value={ctx.search}
            onChange={(e) => ctx.setSearch(e.target.value)}
            readOnly={!ctx.interactive}
            placeholder={block.placeholder}
            aria-label="Rechercher dans le catalogue"
            className="w-full min-w-0 bg-transparent py-3 text-sm outline-none placeholder:opacity-45"
          />
        </div>
        {block.showFilter && (
          <button
            type="button"
            aria-label="Filtres"
            aria-expanded={filtersOpen}
            onClick={ctx.interactive ? () => setFiltersOpen((open) => !open) : undefined}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: ctx.theme.brand,
              color: readableOn(ctx.theme.brand),
              borderColor: ctx.theme.brand,
              opacity: 1,
            }}
          >
            <SlidersHorizontal size={17} />
          </button>
        )}
      </div>
      {filtersOpen && ctx.interactive && (
        <div
          role="menu"
          aria-label="Filtrer par catégorie"
          className="relative z-[9999] mt-2 flex w-full flex-col gap-1 overflow-y-auto rounded-xl border p-2 shadow-2xl sm:max-h-48 sm:flex-row sm:flex-wrap"
          style={{
            backgroundColor: ctx.theme.background,
            color: ctx.theme.ink,
            borderColor: `${ctx.theme.ink}28`,
            opacity: 1,
            isolation: 'isolate',
          }}
        >
          {['Tout', ...categories].map((label) => {
            const value = label === 'Tout' ? null : label
            const active = ctx.category === value
            return (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => {
                  ctx.setCategory(value)
                  setFiltersOpen(false)
                }}
                className="rounded-lg px-3 py-2 text-left text-xs font-semibold sm:text-center"
                style={{
                  backgroundColor: active ? ctx.theme.brand : ctx.theme.background,
                  color: active ? readableOn(ctx.theme.brand) : ctx.theme.ink,
                  border: `1px solid ${active ? ctx.theme.brand : `${ctx.theme.ink}16`}`,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </Shell>
  )
}
