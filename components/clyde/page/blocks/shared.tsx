'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { blockVars, shade, lighten } from '@/lib/clyde/theme'
import { type AvailabilityRule, type Block, type Business, type Currency, type PageTheme, type Product } from '@/lib/clyde/types'

/* Primitives partagées par tous les blocs : coque thémée, titre,
   vignette de produit et étoiles de notation. */

export interface RenderCtx {
  business: Business
  products: Product[]
  availability: AvailabilityRule[]
  theme: PageTheme
  currency: Currency
  device: 'desktop' | 'mobile'
  /** false dans l'éditeur : les contrôles sont visibles mais inertes */
  interactive: boolean
  search: string
  setSearch: (v: string) => void
  category: string | null
  setCategory: (v: string | null) => void
  onOpenProduct?: (p: Product) => void
  onAddToCart?: (p: Product) => void
  /**
   * Réservation d'une prestation.
   *
   * Séparé de `onAddToCart` : un service occupe un créneau, il ne se cumule pas
   * dans un panier. Le « + » d'un service envoyait pourtant une prestation au
   * panier comme un plat, sans jamais demander de date.
   */
  onReserve?: (p: Product) => void
  onBook?: (startAt: string) => void
  onContact?: () => void
}

/* ============================================================
   Primitives thémées
   ============================================================ */

export function Shell({
  block,
  ctx,
  className,
  children,
  bleed,
}: {
  block: Block
  ctx: RenderCtx
  className?: string
  children: React.ReactNode
  bleed?: boolean
}) {
  return (
    <section
      /* Cible d'ancrage : la navigation basse pointe sur le type de bloc
         (#catalogue, #booking, #contact…) et atteint donc vraiment sa section. */
      id={block.type}
      style={{ ...blockVars(block.style, ctx.theme), scrollMarginBottom: 96 }}
      className={cn('w-full scroll-mt-4', className)}
    >
      <div
        /* La largeur de colonne est décidée par le conteneur parent
           (vitrine ou aperçu du builder), pas par le bloc lui-même. */
        className="mx-auto w-full"
        style={bleed ? undefined : { paddingLeft: 'var(--b-pad-x)', paddingRight: 'var(--b-pad-x)' }}
      >
        {children}
      </div>
    </section>
  )
}

export function BlockTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-balance"
      style={{
        fontSize: 'calc(1.35rem * var(--b-scale, 1))',
        fontWeight: 'var(--b-weight, 600)' as unknown as number,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  )
}

/**
 * Visuel d'un produit. Sans photo, on affiche l'initiale sur une surface
 * dérivée de la marque plutôt qu'une image cassée ou un placeholder gris.
 */
export function Thumb({
  src,
  alt,
  ctx,
  className,
  radius,
}: {
  src?: string
  alt: string
  ctx: RenderCtx
  className?: string
  radius?: string
}) {
  if (src) {
    return (
    <img
      src={src}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      style={radius ? { borderRadius: radius } : undefined}
      /* Chargement différé : ces images se répètent dans les grilles de
         catalogue — les charger toutes d'un coup plombait le premier écran. */
      loading="lazy"
      decoding="async"
    />
    )
  }
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center font-bold',
        className,
      )}
      style={{
        borderRadius: radius,
        background: `linear-gradient(135deg, ${lighten(ctx.theme.brand, 0.72)}, ${lighten(ctx.theme.brand, 0.5)})`,
        color: shade(ctx.theme.brand, 0.35),
        fontSize: '1.5rem',
      }}
      aria-label={alt}
      role="img"
    >
      {alt.trim().charAt(0).toUpperCase() || '·'}
    </div>
  )
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-current' : 'opacity-25'}
          style={{ color: 'var(--p-brand)' }}
        />
      ))}
    </span>
  )
}
