'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { controlSurface } from '@/lib/clyde/theme'
import { Shell, type RenderCtx } from './shared'
import { CarouselRail } from './rail'
import { type Block } from '@/lib/clyde/types'

/* Bloc 3 — Catégories. */
export function CategoriesRender({
  block,
  ctx,
}: {
  block: Extract<Block, { type: 'categories' }>
  ctx: RenderCtx
}) {
  const items = useMemo(() => {
    if (!block.autoFromCatalogue && block.items.length) return block.items
    const set = new Set<string>()
    for (const p of ctx.products) if (p.category_label) set.add(p.category_label)
    const auto = Array.from(set)
    return auto.length ? auto : ['Populaires', 'Nouveautés']
  }, [block.autoFromCatalogue, block.items, ctx.products])

  const all = ['Tout', ...items]
  const display = block.display ?? 'wrap'

  /* Vignette du mode `card` : la première photo trouvée dans la catégorie.
     On la calcule une fois pour tous les libellés plutôt que de reparcourir
     le catalogue à chaque bouton. */
  const covers = useMemo(() => {
    if (display !== 'card') return {}
    const map: Record<string, string> = {}
    for (const p of ctx.products) {
      const key = p.category_label
      if (key && !map[key] && p.media_urls[0]) map[key] = p.media_urls[0]
    }
    return map
  }, [display, ctx.products])

  const gutters = { paddingLeft: 'var(--b-pad-x)', paddingRight: 'var(--b-pad-x)' }

  if (display === 'card') {
    return (
      <Shell block={block} ctx={ctx} bleed>
        {/* Piste glissante : les vignettes gardent leur largeur et débordent
            plutôt que de rétrécir jusqu'à l'illisible. `snap` pour que le
            geste au doigt s'arrête sur une vignette entière. */}
        <CarouselRail
          enabled={ctx.interactive}
          ariaLabel="Catégories"
          itemCount={all.length}
          style={gutters}
        >
          {all.map((label) => {
            const value = label === 'Tout' ? null : label
            const active = ctx.category === value
            const cover = value ? covers[value] : undefined
            return (
              <button
                key={label}
                type="button"
                onClick={ctx.interactive ? () => ctx.setCategory(value) : undefined}
                className="relative h-24 w-32 shrink-0 snap-start overflow-hidden text-left transition-transform active:scale-[0.98]"
                style={controlSurface(ctx.theme, { radius: 'var(--p-card-radius)', active })}
                aria-pressed={active}
              >
                {cover ? (
                  <Image src={cover} alt="" fill sizes="128px" className="object-cover" />
                ) : null}
                {/* Voile systématique, y compris sans photo : le libellé reste
                    lisible quelle que soit la teinte de l'image. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background: cover
                      ? 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 70%)'
                      : undefined,
                  }}
                />
                <span
                  className="absolute inset-x-0 bottom-0 p-2 text-[13px] font-semibold"
                  style={cover ? { color: '#fff' } : undefined}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </CarouselRail>
      </Shell>
    )
  }

  if (display === 'scroll') {
    return (
      <Shell block={block} ctx={ctx} bleed>
        <CarouselRail
          enabled={ctx.interactive}
          ariaLabel="Catégories"
          itemCount={all.length}
          style={gutters}
        >
          {all.map((label) => {
            const value = label === 'Tout' ? null : label
            const active = ctx.category === value
            return (
              <button
                key={label}
                type="button"
                onClick={ctx.interactive ? () => ctx.setCategory(value) : undefined}
                className="shrink-0 snap-start px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors"
                style={controlSurface(ctx.theme, {
                  radius: 'var(--p-btn-radius)',
                  active,
                })}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </CarouselRail>
      </Shell>
    )
  }

  return (
    <Shell block={block} ctx={ctx} bleed>
      <div className="flex flex-wrap gap-2" style={gutters}>
        {all.map((label) => {
          const value = label === 'Tout' ? null : label
          const active = ctx.category === value
          return (
            <button
              key={label}
              type="button"
              onClick={ctx.interactive ? () => ctx.setCategory(value) : undefined}
              className="shrink-0 px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors"
              style={controlSurface(ctx.theme, {
                radius: 'var(--p-btn-radius)',
                active,
              })}
              aria-pressed={active}
            >
              {label}
            </button>
          )
        })}
      </div>
    </Shell>
  )
}
