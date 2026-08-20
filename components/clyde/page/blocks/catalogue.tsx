'use client'

import { useMemo } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { brandButton, cardSurface, readableOn } from '@/lib/clyde/theme'
import { formatPrice } from '@/lib/clyde/taxonomy'
import { Shell, BlockTitle, Thumb, Stars, type RenderCtx } from './shared'
import { type CatalogueBlock, type Product } from '@/lib/clyde/types'

/* Bloc 4 — Catalogue (grille, liste et variante livraison). */

function ProductCard({
  p,
  ctx,
  block,
  layout,
}: {
  p: Product
  ctx: RenderCtx
  block: CatalogueBlock
  layout: 'grid' | 'list'
}) {
  const img = p.media_urls[0]
  const open = ctx.interactive && ctx.onOpenProduct ? () => ctx.onOpenProduct?.(p) : undefined

  /* Une prestation ne se cumule pas dans un panier : elle occupe un créneau.
     Le bouton d'action ouvre donc la réservation, et son icône l'annonce —
     un « + » promettait un ajout au panier qui n'avait pas de sens ici. */
  const isService = p.type === 'service'
  const ActionIcon = isService ? CalendarDays : Plus
  const act = ctx.interactive
    ? () => (isService ? ctx.onReserve?.(p) : ctx.onAddToCart?.(p))
    : undefined
  const actLabel = isService
    ? `Réserver ${p.name}`
    : `Ajouter ${p.name} au panier`

  if (layout === 'list') {
    return (
      <div
        className="flex items-center gap-3 p-2.5 text-left"
        style={{
          ...cardSurface(ctx.theme),
        }}
      >
        <button
          type="button"
          onClick={open}
          className="size-[68px] shrink-0 overflow-hidden"
          style={{ borderRadius: 'calc(var(--b-radius) * 0.7)' }}
        >
          <Thumb src={img} alt={p.name} ctx={ctx} />
        </button>
        <div className="min-w-0 flex-1">
          <button type="button" onClick={open} className="block text-left">
            <p className="truncate text-sm font-semibold">{p.name}</p>
          </button>
          {p.description && (
            <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug opacity-55">
              {p.description}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            {block.showPrice && (
              <span className="text-[13px] font-bold" style={{ color: 'var(--p-brand)' }}>
                {formatPrice(p.price, ctx.currency)}
              </span>
            )}
            {p.compare_at_price && (
              <span className="text-[11px] line-through opacity-40">
                {formatPrice(p.compare_at_price, ctx.currency)}
              </span>
            )}
            {block.showRating && <Stars value={4.6} size={11} />}
          </div>
        </div>
        <button
          type="button"
          onClick={act}
          disabled={!p.available}
          aria-label={p.available ? actLabel : `${p.name} épuisé`}
          title={p.available ? actLabel : 'Épuisé'}
          className="flex size-10 shrink-0 items-center justify-center disabled:opacity-40"
          style={{ ...brandButton(ctx.theme), borderRadius: 999 }}
        >
          <ActionIcon className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col overflow-hidden text-left"
      style={{
        ...cardSurface(ctx.theme),
      }}
    >
      <button type="button" onClick={open} className="relative block aspect-square overflow-hidden @[26rem]:aspect-[4/3]">
        <Thumb src={img} alt={p.name} ctx={ctx} />
        {!p.available && (
          <span className="absolute inset-x-0 bottom-0 bg-black/65 py-1 text-center text-[10px] font-bold tracking-wider text-white uppercase">
            Indisponible
          </span>
        )}
        {p.compare_at_price && p.available && (
          <span
            className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold"
            style={{
              borderRadius: 4,
              background: 'var(--p-brand)',
              color: readableOn(ctx.theme.brand),
            }}
          >
            -{Math.max(1, Math.round((1 - p.price / p.compare_at_price) * 100))}%
          </span>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5">
        <button type="button" onClick={open} className="min-w-0 text-left">
          <p className="line-clamp-2 text-[13px] leading-tight font-semibold">{p.name}</p>
        </button>
        {block.showRating && <Stars value={4.6} size={11} />}
        {/* Prix et ajout au panier sur une seule ligne : la carte reste dense
            et le « + » remplace un libellé qui débordait sur deux lignes. */}
        <div className="mt-auto flex min-w-0 items-end justify-between gap-2 pt-1.5">
          <div className="flex min-w-0 flex-col">
            {block.showPrice && (
              <p className="min-w-0 truncate text-[13px] font-bold" style={{ color: 'var(--p-brand)' }}>
                {formatPrice(p.price, ctx.currency)}
              </p>
            )}
            {p.compare_at_price && (
              <p className="text-[10px] line-through opacity-40">
                {formatPrice(p.compare_at_price, ctx.currency)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={act}
            disabled={!p.available}
            aria-label={p.available ? actLabel : `${p.name} indisponible`}
            title={p.available ? actLabel : 'Indisponible'}
            className="flex size-9 shrink-0 items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
            style={{ ...brandButton(ctx.theme), borderRadius: 999 }}
          >
            <ActionIcon className="size-[17px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function CatalogueRender({ block, ctx }: { block: CatalogueBlock; ctx: RenderCtx }) {
  const list = useMemo(() => {
    const q = ctx.search.trim().toLowerCase()
    return ctx.products.filter((p) => {
      if (!p.active) return false
      if (ctx.category && p.category_label !== ctx.category) return false
      if (q && !`${p.name} ${p.description ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [ctx.products, ctx.search, ctx.category])

  /* Genre « commande » : le catalogue devient l'écran central d'une app de
     livraison — rail de catégories épinglé à gauche, liste dense à droite. */
  if ((ctx.theme.preset ?? 'vitrine') === 'commande') {
    return <DeliveryCatalogue block={block} ctx={ctx} list={list} />
  }

  const cols = ctx.device === 'mobile' ? 2 : block.columns
  const layout = block.display

  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-4">
        {block.title && <BlockTitle>{block.title}</BlockTitle>}
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm opacity-50">
            Aucun résultat pour cette recherche.
          </p>
        ) : layout === 'grid' ? (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {list.map((p) => (
              <ProductCard key={p.id} p={p} ctx={ctx} block={block} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} ctx={ctx} block={block} layout="list" />
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}

/**
 * Catalogue façon application de livraison (référence : Eleme / Meituan).
 *
 * Deux colonnes structurantes :
 * - à gauche, un RAIL de catégories étroit, épinglé pendant qu'on défile la
 *   liste — l'onglet actif porte la couleur de marque et une barre latérale ;
 * - à droite, la LISTE dense : vignette carrée, nom en gras, description sur
 *   une ligne, prix en couleur de marque avec prix barré, « + » rond à droite.
 *
 * Le rail réutilise `ctx.category` / `ctx.setCategory` — le même état que les
 * pastilles du bloc Catégories : les deux genres filtrent la même donnée.
 */
function DeliveryCatalogue({
  block,
  ctx,
  list,
}: {
  block: CatalogueBlock
  ctx: RenderCtx
  list: Product[]
}) {
  /* Les rayons, dans l'ordre d'apparition du catalogue. */
  const categories = useMemo(() => {
    const seen: string[] = []
    for (const p of ctx.products) {
      if (!p.active || !p.category_label) continue
      if (!seen.includes(p.category_label)) seen.push(p.category_label)
    }
    return seen
  }, [ctx.products])

  const railBtn = (label: string, value: string | null) => {
    const active = ctx.category === value
    return (
      <button
        key={label}
        type="button"
        onClick={ctx.interactive ? () => ctx.setCategory(value) : undefined}
        aria-pressed={active}
        className="relative w-full px-2 py-3 text-center text-[12px] leading-tight transition-colors"
        style={{
          background: active ? 'color-mix(in srgb, var(--p-brand) 10%, transparent)' : 'transparent',
          color: active ? 'var(--p-brand)' : 'inherit',
          fontWeight: active ? 700 : 500,
          opacity: active ? 1 : 0.65,
        }}
      >
        {/* Barre latérale : le marqueur d'onglet actif des apps de commande. */}
        {active && (
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full"
            style={{ background: 'var(--p-brand)' }}
          />
        )}
        {label}
      </button>
    )
  }

  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-3">
        {block.title && <BlockTitle>{block.title}</BlockTitle>}
        <div className="flex items-start gap-0 overflow-hidden" style={{ borderRadius: 'var(--b-radius)' }}>
          {/* Rail gauche : étroit, épinglé, fond légèrement en retrait pour
              détacher la liste. */}
          <nav
            aria-label="Rayons"
            className="sticky top-2 flex max-h-[70vh] w-[88px] shrink-0 flex-col overflow-y-auto"
            style={{ background: 'color-mix(in srgb, var(--p-ink) 5%, transparent)' }}
          >
            {railBtn('Tout', null)}
            {categories.map((c) => railBtn(c, c))}
          </nav>

          {/* Liste dense : une rangée par article, séparées d'un trait fin. */}
          <div className="min-w-0 flex-1">
            {list.length === 0 ? (
              <p className="py-8 text-center text-sm opacity-50">
                Aucun résultat pour cette recherche.
              </p>
            ) : (
              list.map((p) => <DeliveryRow key={p.id} p={p} ctx={ctx} block={block} />)
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}

/** Une rangée d'article du genre « commande » : photo, texte, prix, « + ». */
function DeliveryRow({ p, ctx, block }: { p: Product; ctx: RenderCtx; block: CatalogueBlock }) {
  const img = p.media_urls[0]
  const open = ctx.interactive && ctx.onOpenProduct ? () => ctx.onOpenProduct?.(p) : undefined
  const isService = p.type === 'service'
  const ActionIcon = isService ? CalendarDays : Plus
  const act = ctx.interactive
    ? () => (isService ? ctx.onReserve?.(p) : ctx.onAddToCart?.(p))
    : undefined
  const promo = p.compare_at_price
    ? Math.max(1, Math.round((1 - p.price / p.compare_at_price) * 100))
    : null

  return (
    <div
      className="flex items-start gap-3 px-3 py-3"
      style={{ borderBottom: '1px solid color-mix(in srgb, var(--p-ink) 8%, transparent)' }}
    >
      <button
        type="button"
        onClick={open}
        className="relative size-[84px] shrink-0 overflow-hidden"
        style={{ borderRadius: 'calc(var(--b-radius) * 0.6)' }}
      >
        <Thumb src={img} alt={p.name} ctx={ctx} />
        {!p.available && (
          <span className="absolute inset-0 grid place-items-center bg-black/55 text-[10px] font-bold tracking-wide text-white uppercase">
            Épuisé
          </span>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <button type="button" onClick={open} className="block min-w-0 text-left">
          <p className="line-clamp-2 text-[14px] leading-snug font-bold">{p.name}</p>
        </button>
        {p.description && (
          <p className="line-clamp-1 text-[12px] opacity-55">{p.description}</p>
        )}
        {/* Badge de remise en pastille bordée, comme le « 8.72折 » du modèle. */}
        {promo && p.available && (
          <span
            className="w-fit rounded px-1.5 py-px text-[10px] font-bold"
            style={{
              border: '1px solid var(--p-brand)',
              color: 'var(--p-brand)',
            }}
          >
            -{promo}%
          </span>
        )}
        {/* `flex-wrap` sur le groupe prix : quand la colonne devient étroite,
            l'ancien prix barré passe à la ligne au lieu de venir buter contre
            le bouton d'action — le prix et le « + » gardent toujours leur
            espace de respiration. */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            {block.showPrice && (
              <span
                className="text-[15px] font-extrabold whitespace-nowrap"
                style={{ color: 'var(--p-brand)' }}
              >
                {formatPrice(p.price, ctx.currency)}
              </span>
            )}
            {p.compare_at_price && (
              <span className="text-[11px] whitespace-nowrap line-through opacity-40">
                {formatPrice(p.compare_at_price, ctx.currency)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={act}
            disabled={!p.available}
            aria-label={
              p.available
                ? isService
                  ? `Réserver ${p.name}`
                  : `Ajouter ${p.name} au panier`
                : `${p.name} épuisé`
            }
            className="flex size-8 shrink-0 items-center justify-center transition-transform active:scale-95 disabled:opacity-40"
            style={{ ...brandButton(ctx.theme), borderRadius: 999 }}
          >
            <ActionIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
