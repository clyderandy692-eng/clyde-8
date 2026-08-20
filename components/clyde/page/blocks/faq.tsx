'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cardSurface } from '@/lib/clyde/theme'
import { Shell, BlockTitle, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 9 — Questions fréquentes. */

export function FaqRender({ block, ctx }: { block: Extract<Block, { type: 'faq' }>; ctx: RenderCtx }) {
  const [open, setOpen] = useState<string | null>(block.items[0]?.id ?? null)
  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-4">
        <BlockTitle>{block.title}</BlockTitle>
        <div className="flex flex-col gap-2">
          {block.items.map((it) => {
            const isOpen = open === it.id
            return (
              <div
                key={it.id}
                style={{
                  ...cardSurface(ctx.theme),
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : it.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 p-3.5 text-left"
                >
                  <span className="text-[13px] font-semibold">{it.q}</span>
                  <ChevronDown
                    size={16}
                    className="shrink-0 opacity-50 transition-transform"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                  />
                </button>
                {isOpen && (
                  <p className="px-3.5 pb-3.5 text-[13px] leading-relaxed opacity-70">{it.a}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Shell>
  )
}
