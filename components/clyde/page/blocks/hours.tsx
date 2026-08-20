'use client'

import { MapPin } from 'lucide-react'
import { frameSurface, tint } from '@/lib/clyde/theme'
import { Shell, BlockTitle, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 10 — Horaires et localisation. */

export function HoursRender({
  block,
  ctx,
}: {
  block: Extract<Block, { type: 'hours_location' }>
  ctx: RenderCtx
}) {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(block.mapQuery || block.address)}&output=embed`
  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-4">
        <BlockTitle>{block.title}</BlockTitle>
        <div className="grid gap-4 @lg:grid-cols-2">
          <div className="overflow-hidden" style={frameSurface(ctx.theme)}>
            <div className="flex items-start gap-2 p-3.5">
              <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--p-brand)' }} />
              <p className="text-[13px] leading-snug font-medium">{block.address}</p>
            </div>
            <div style={{ borderTop: `1px solid ${tint(ctx.theme.ink, 0.08)}` }}>
              {block.hours.map((h, i) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[12px]"
                  style={{
                    borderTop: i ? `1px solid ${tint(ctx.theme.ink, 0.06)}` : undefined,
                  }}
                >
                  <span className="font-medium opacity-70">{h.day}</span>
                  <span className="font-semibold tabular-nums">{h.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="min-h-[200px] overflow-hidden"
            style={frameSurface(ctx.theme)}
          >
            <iframe
              title={`Carte — ${block.address}`}
              src={mapSrc}
              className="h-full min-h-[200px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </Shell>
  )
}
