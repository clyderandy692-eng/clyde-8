'use client'

import { Mail, Phone } from 'lucide-react'
import { brandButton, frameSurface, outlineButton, surfaceOf, tint } from '@/lib/clyde/theme'
import { Shell, BlockTitle, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 12 — Contact et appel à l’action final. */

export function ContactRender({
  block,
  ctx,
}: {
  block: Extract<Block, { type: 'contact' }>
  ctx: RenderCtx
}) {
  return (
    <Shell block={block} ctx={ctx}>
      <div
        className="flex flex-col items-center gap-3 p-6 text-center"
        style={{
          /* Le fond teinté marque reste la signature de ce bloc ; seul le
             contour suit la matière, sinon le contour marqué s'arrêtait net
             au dernier bloc de la page. */
          ...(surfaceOf(ctx.theme) === 'cartoon'
            ? frameSurface(ctx.theme)
            : {
                borderRadius: 'var(--b-radius)',
                border: `1px solid ${tint(ctx.theme.brand, 0.25)}`,
              }),
          background: tint(ctx.theme.brand, 0.1),
        }}
      >
        <BlockTitle>{block.title}</BlockTitle>
        {block.description && (
          <p className="max-w-md text-pretty text-[13px] leading-relaxed opacity-65">
            {block.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={ctx.interactive ? ctx.onContact : undefined}
            className="px-5 py-3 text-sm font-bold"
            style={brandButton(ctx.theme)}
          >
            {block.ctaLabel}
          </button>
          {block.phone && (
            <a
              href={`tel:${block.phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold"
              style={outlineButton(ctx.theme)}
            >
              <Phone size={14} /> {block.phone}
            </a>
          )}
          {block.email && (
            <a
              href={`mailto:${block.email}`}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold"
              style={outlineButton(ctx.theme)}
            >
              <Mail size={14} /> Email
            </a>
          )}
        </div>
        {block.socials.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            {block.socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold underline decoration-1 underline-offset-2 opacity-65"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}
