'use client'

import { useMemo } from 'react'
import { cardSurface, frameSurface } from '@/lib/clyde/theme'
import { formatPrice } from '@/lib/clyde/taxonomy'
import { Shell, BlockTitle, Thumb, type RenderCtx } from './shared'
import { CarouselRail } from './rail'
import { type CarouselBlock, type Product } from '@/lib/clyde/types'

/* Bloc 5 — Carrousel. */

export function CarouselRender({ block, ctx }: { block: CarouselBlock; ctx: RenderCtx }) {
  const list = useMemo(() => {
    const picked = block.productIds.length
      ? block.productIds.map((id) => ctx.products.find((p) => p.id === id)).filter(Boolean)
      : ctx.products.slice(0, 6)
    return picked as Product[]
  }, [block.productIds, ctx.products])

  const variant = block.variant ?? 'overlay'
  /* Mobile : 1 carte visible + bout de la suivante — le débordement signale
     qu'on peut glisser. Desktop : 3 cartes + bout de la suivante. */
  const cardW = ctx.device === 'mobile' ? '72%' : '30%'

  /* Mode « images libres » : visuels promotionnels téléversés, sans produit
     derrière — même rail, cartes sans prix ni clic produit. */
  const images = (block.images ?? []).filter(Boolean)
  if (block.source === 'images') {
    if (images.length === 0 && ctx.interactive) return null
    return (
      <Shell block={block} ctx={ctx} bleed>
        <div className="flex flex-col gap-3">
          {block.title && (
            <div style={{ paddingLeft: 'var(--b-pad-x)', paddingRight: 'var(--b-pad-x)' }}>
              <BlockTitle>{block.title}</BlockTitle>
            </div>
          )}
          <CarouselRail
            enabled
            ariaLabel={block.title || 'Carrousel'}
            itemCount={images.length}
            style={{ paddingLeft: 'var(--b-pad-x)', paddingRight: 'var(--b-pad-x)' }}
          >
            {images.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="shrink-0 snap-start overflow-hidden"
                style={{ ...frameSurface(ctx.theme), width: cardW, minWidth: cardW }}
              >
                <div className="aspect-[16/10] w-full">
                  <Thumb src={src} alt={block.title ? `${block.title} ${i + 1}` : `Visuel ${i + 1}`} ctx={ctx} />
                </div>
              </div>
            ))}
            {images.length === 0 ? (
              <div
                className="flex aspect-[16/10] shrink-0 snap-start items-center justify-center border border-dashed text-center"
                style={{ ...frameSurface(ctx.theme), width: cardW, minWidth: cardW }}
              >
                <p className="px-4 text-[12px] text-muted-foreground">
                  Téléversez des images dans les réglages du bloc
                </p>
              </div>
            ) : null}
          </CarouselRail>
        </div>
      </Shell>
    )
  }

  return (
    <Shell block={block} ctx={ctx} bleed>
      <div className="flex flex-col gap-3">
        {block.title && (
          <div style={{ paddingLeft: 'var(--b-pad-x)', paddingRight: 'var(--b-pad-x)' }}>
            <BlockTitle>{block.title}</BlockTitle>
          </div>
        )}
        <CarouselRail
          /* Le défilement reste visible dans l'éditeur comme sur la vitrine.
             `interactive` ne doit contrôler que les clics sur les cartes. */
          enabled
          ariaLabel={block.title || 'Sélection du moment'}
          itemCount={list.length}
          style={{ paddingLeft: 'var(--b-pad-x)', paddingRight: 'var(--b-pad-x)' }}
        >
          {list.map((p) => {
            const open = ctx.interactive ? () => ctx.onOpenProduct?.(p) : undefined

            if (variant === 'card') {
              /* Photo en haut, cartouche opaque dessous : la variante la plus
                 sobre, lisible sur n'importe quelle photo. */
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={open}
                  className="flex shrink-0 snap-start flex-col overflow-hidden text-left"
                  style={{ ...cardSurface(ctx.theme), width: cardW, minWidth: cardW }}
                >
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <Thumb src={p.media_urls[0]} alt={p.name} ctx={ctx} />
                  </div>
                  <div className="flex flex-col gap-0.5 p-3">
                    <p className="line-clamp-1 text-[13px] font-semibold">{p.name}</p>
                    <p className="text-[12px] font-bold" style={{ color: 'var(--p-brand)' }}>
                      {formatPrice(p.price, ctx.currency)}
                    </p>
                  </div>
                </button>
              )
            }

            if (variant === 'caption' || variant === 'glass') {
              /* Cartouche sombre arrondi posé dans la photo (remplace
                 l'ancien bandeau glassmorphe : le flou translucide rendait
                 les noms illisibles sur les photos claires). Le fond opaque
                 garantit le contraste, et le nom garde deux lignes. */
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={open}
                  className="relative shrink-0 snap-start overflow-hidden text-left"
                  style={{ ...frameSurface(ctx.theme), width: cardW, minWidth: cardW }}
                >
                  <div className="aspect-[4/3] w-full">
                    <Thumb src={p.media_urls[0]} alt={p.name} ctx={ctx} />
                  </div>
                  <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-[13px] leading-snug font-semibold text-white">
                        {p.name}
                      </span>
                    </span>
                    <span
                      className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-bold text-white"
                      style={{ background: 'var(--p-brand)' }}
                    >
                      {formatPrice(p.price, ctx.currency)}
                    </span>
                  </div>
                </button>
              )
            }

            /* `overlay` (défaut) : dégradé sombre en pied de photo. */
            return (
              <button
                key={p.id}
                type="button"
                onClick={open}
                className="relative shrink-0 snap-start overflow-hidden text-left"
                style={{ ...frameSurface(ctx.theme), width: cardW, minWidth: cardW }}
              >
                <div className="aspect-[16/10] w-full">
                  <Thumb src={p.media_urls[0]} alt={p.name} ctx={ctx} />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <p className="line-clamp-1 text-[13px] font-semibold text-white">{p.name}</p>
                  {/* Blanc plutôt que la couleur de marque : sur fond sombre,
                      un orange saturé vibrait et restait peu lisible. */}
                  <p className="text-[12px] font-bold text-white/90">
                    {formatPrice(p.price, ctx.currency)}
                  </p>
                </div>
              </button>
            )
          })}
        </CarouselRail>
      </div>
    </Shell>
  )
}

/*
 * Rail horizontal glissant — utilisé pour les catégories et la sélection.
 *
 * Principe :
 *  - Le défilement est natif (overflow-x: auto + touch-action: pan-x).
 *    Sur mobile le swipe fonctionne sans JS.
 *  - Un requestAnimationFrame incrémente scrollLeft de ~0.35 px par frame
 *    (≈ 21 px/s à 60 fps). Cette méthode contourne le blocage causé par
 *    `scroll-smooth` qui ignorait les mutations directes sur scrollLeft.
 *  - Aucun indicateur (points, flèches) : le rail déborde intentionnellement
 *    pour signaler qu'il y a du contenu à découvrir.
 *  - Le défilement s'arrête lorsque l'utilisateur touche le rail, puis
 *    reprend 2 s après qu'il a relâché.
 */
