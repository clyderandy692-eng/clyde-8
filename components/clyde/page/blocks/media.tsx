'use client'

import Image from 'next/image'
import { Images } from 'lucide-react'
import { cn } from '@/lib/utils'
import { insetFill } from '@/lib/clyde/theme'
import { Shell, BlockTitle, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Blocs 13 et 14 — Média d'identité et galerie d'images. */
export function IdentityMediaRender({ block, ctx }: { block: Extract<Block, { type: 'identity_media' }>; ctx: RenderCtx }) {
  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col items-center gap-2.5 text-center">
        {block.showLogo && (
          <div className="size-20 overflow-hidden rounded-3xl border-4 bg-background shadow-lg" style={{ borderColor: `${ctx.theme.brand}55` }}>
            {ctx.business.logo_url ? <Image src={ctx.business.logo_url} alt={`Logo ${ctx.business.name}`} width={80} height={80} sizes="80px" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl font-bold" style={{ color: ctx.theme.brand }}>{ctx.business.name.charAt(0)}</div>}
          </div>
        )}
        {block.showProfile && <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: ctx.theme.brand }}>{ctx.business.category.replaceAll('_', ' ')}</p>}
        <h2 className="text-balance text-2xl font-bold">{block.title}</h2>
        <p className="max-w-md text-sm leading-relaxed opacity-70">{block.subtitle}</p>
      </div>
    </Shell>
  )
}

export function ImageGalleryRender({ block, ctx }: { block: Extract<Block, { type: 'image_gallery' }>; ctx: RenderCtx }) {
  if (!block.images.length) {
    /* Sur la page publique, une galerie vide ne s'affiche pas du tout : la
       consigne « Ajoutez des photos depuis le builder » est adressée au
       commerçant, jamais à son client. Dans l'éditeur (interactive === false)
       on garde le bloc visible pour qu'il reste sélectionnable. */
    if (ctx.interactive) return null
    return (
      <Shell block={block} ctx={ctx}>
        <div
          className="flex flex-col items-center gap-2 px-5 py-8 text-center"
          style={{ borderRadius: 'var(--b-radius)', background: insetFill(ctx.theme) }}
        >
          <Images className="size-6 opacity-35" aria-hidden="true" />
          <BlockTitle>{block.title}</BlockTitle>
          <p className="text-[13px] opacity-60">Ajoutez des photos depuis le constructeur de page.</p>
        </div>
      </Shell>
    )
  }
  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-3">
        <BlockTitle>{block.title}</BlockTitle>
        <div className={cn('grid gap-2', block.columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
          {block.images.map((url) => (
            <Image
              key={url}
              src={url}
              alt="Photo de la boutique"
              width={640}
              height={640}
              sizes={block.columns === 3 ? '(max-width: 767px) 33vw, 240px' : '(max-width: 767px) 50vw, 360px'}
              className="aspect-square w-full object-cover"
              style={{ borderRadius: 'calc(var(--b-radius) * 0.8)' }}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </Shell>
  )
}
