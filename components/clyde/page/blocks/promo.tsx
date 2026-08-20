'use client'

import { useState } from 'react'
import { CalendarDays, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { readableOn, lighten } from '@/lib/clyde/theme'
import { formatPrice } from '@/lib/clyde/taxonomy'
import { Shell, Thumb, type RenderCtx } from './shared'
import { type Block, type Product } from '@/lib/clyde/types'

/* Bloc 6 — Bannière promotionnelle. */

export function PromoRender({ block, ctx }: { block: Extract<Block, { type: 'promo' }>; ctx: RenderCtx }) {
  const product = block.productId ? ctx.products.find((p) => p.id === block.productId) : null
  const remaining = useCountdown(block.endsAt)

  return (
    <Shell block={block} ctx={ctx}>
      <div
        className="flex flex-col gap-4 overflow-hidden p-5 @lg:flex-row @lg:items-center"
        style={{
          borderRadius: 'var(--b-radius)',
          background: `linear-gradient(120deg, ${ctx.theme.brand}, ${lighten(ctx.theme.brand, 0.32)})`,
          color: readableOn(ctx.theme.brand),
        }}
      >
        <div className="min-w-0 flex-1 text-left">
          <p className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase opacity-70">
            Offre limitée
          </p>
          <p
            className="mt-1 text-balance"
            style={{
              fontSize: 'calc(1.3rem * var(--b-scale, 1))',
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {block.title}
          </p>
          {block.description && (
            <p className="mt-1 text-[13px] leading-snug opacity-80">{block.description}</p>
          )}
          {remaining && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-black/15 px-2 py-1 font-mono text-[11px] font-bold">
              <Clock size={12} /> {remaining}
            </p>
          )}
        </div>

        {product && (
          <div className="flex items-center gap-3 rounded-xl bg-black/12 p-2.5">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg">
              <Thumb src={product.media_urls[0]} alt={product.name} ctx={ctx} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{product.name}</p>
              <p className="text-sm font-bold">
                {formatPrice(product.price, ctx.currency)}
                {product.compare_at_price && (
                  <span className="ml-1.5 text-[11px] font-normal line-through opacity-65">
                    {formatPrice(product.compare_at_price, ctx.currency)}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* L'offre mène toujours quelque part : au panier si un article est
            associé, au catalogue sinon. Plus de bouton mort. */}
        <PromoCta block={block} ctx={ctx} product={product ?? null} />
      </div>
    </Shell>
  )
}

function PromoCta({
  block,
  ctx,
  product,
}: {
  block: Extract<Block, { type: 'promo' }>
  ctx: RenderCtx
  product: Product | null
}) {
  const style = {
    borderRadius: 'var(--p-btn-radius)',
    background: readableOn(ctx.theme.brand),
    color: ctx.theme.brand,
  } as const
  const className = 'inline-flex shrink-0 items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-bold'

  /* Le produit mis en avant peut être une prestation : elle se réserve, et
     le libellé du bloc parlerait sinon d'ajout au panier. */
  const isService = product?.type === 'service'
  if (product && (isService ? ctx.onReserve : ctx.onAddToCart)) {
    const Icon = isService ? CalendarDays : Plus
    return (
      <button
        type="button"
        onClick={
          ctx.interactive
            ? () => (isService ? ctx.onReserve?.(product) : ctx.onAddToCart?.(product))
            : undefined
        }
        disabled={!product.available}
        className={cn(className, 'disabled:opacity-50')}
        style={style}
      >
        <Icon className="size-4" aria-hidden="true" />
        {product.available
          ? isService
            ? 'Réserver'
            : block.ctaLabel
          : 'Indisponible'}
      </button>
    )
  }

  /* Sans panier disponible (aperçu, maquette), on renvoie vers le catalogue
     de la page : l'intention du bouton reste lisible. */
  return (
    <a href="#catalogue" className={className} style={style}>
      {block.ctaLabel}
    </a>
  )
}

function useCountdown(endsAt: string | null) {
  const [now] = useState(() => Date.now())
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - now
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return d > 0 ? `${d} j ${h} h restantes` : `${h} h ${m} min restantes`
}
