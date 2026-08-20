'use client'

import { CalendarDays, Grid2X2, Home, Plus, Search } from 'lucide-react'
import { isDark, readableOn, lighten } from '@/lib/clyde/theme'
import { type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 15 — Navigation basse de la vitrine. */
const NAV_ICONS = { home: Home, calendar: CalendarDays, search: Search, grid: Grid2X2, plus: Plus }

/**
 * Navigation basse — barre flottante d'application, avec action centrale
 * surélevée. Le positionnement collant est posé par le conteneur de rendu :
 * la barre reste donc visible pendant tout le défilement de la page.
 */
export function BottomNavRender({ block, ctx }: { block: Extract<Block, { type: 'bottom_nav' }>; ctx: RenderCtx }) {
  if (block.showOn === 'mobile' && ctx.device !== 'mobile') return null
  const dark = isDark(ctx.theme.background)
  const barBg = dark ? lighten(ctx.theme.background, 0.1) : ctx.theme.background
  const navStyle = block.navStyle ?? 'floating'

  /* Une barre de navigation basse cesse d'être lisible au-delà de cinq
     entrées sur un téléphone : chaque cible passerait sous les 44 px
     recommandés et les libellés seraient rognés. On plafonne donc le rendu,
     quel que soit le nombre d'entrées saisies par le commerçant. */
  const items = block.items.slice(0, 5)
  if (items.length === 0) return null

  /* L'onglet actif est l'accueil (page unique : c'est la section d'arrivée).
     À défaut d'icône « maison », la première entrée fait office d'actif. */
  const homeIndex = items.findIndex((it) => it.icon === 'home')
  const activeIndex = homeIndex >= 0 ? homeIndex : 0

  /* Voile dégradé sous les barres flottantes : le contenu qui défile passe
     derrière sans jamais sembler traverser la barre. */
  const scrim = `linear-gradient(to top, ${ctx.theme.background} 55%, ${ctx.theme.background}00)`

  /* ---- `dark-pill` : pilule sombre compacte (inspirée des apps food) ---- */
  if (navStyle === 'dark-pill') {
    /* Fond volontairement opaque : un noir translucide laissait lire le texte
       de la page à travers la barre. */
    const pillBg = '#111214'
    return (
      <div
        className="pointer-events-none px-3 pt-12 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ backgroundImage: scrim }}
      >
        <nav
          aria-label="Navigation de la page"
          className="pointer-events-auto mx-auto flex w-full max-w-sm items-stretch gap-0.5 rounded-full p-1.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
          style={{ background: pillBg }}
        >
          {items.map((item, i) => {
            const Icon = NAV_ICONS[item.icon]
            const active = i === activeIndex
            return (
              <a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'true' : undefined}
                /* `flex-1 basis-0 min-w-0` : toutes les entrées se partagent la
                   largeur à égalité et la barre ne peut jamais déborder. */
                className="flex min-h-11 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 transition-transform active:scale-95"
                style={active ? { background: ctx.theme.brand, color: readableOn(ctx.theme.brand) } : { color: '#FFFFFFA6' }}
              >
                {/* `shrink-0` : sans lui, le flex écrasait les icônes en
                    quelques pixels de large — elles devenaient illisibles. */}
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                <span className="max-w-full truncate text-[10px] font-semibold tracking-tight">{item.label}</span>
              </a>
            )
          })}
        </nav>
      </div>
    )
  }

  /* ---- `docked` : barre pleine largeur collée au bord ---- */
  if (navStyle === 'docked') {
    return (
      <nav
        aria-label="Navigation de la page"
        className="flex items-stretch border-t px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        style={{ background: barBg, borderColor: `${ctx.theme.ink}14` }}
      >
        {items.map((item, i) => {
          const Icon = NAV_ICONS[item.icon]
          const primary = item.icon === 'plus'
          const active = i === activeIndex
          return (
            <a
              key={item.id}
              href={item.href}
              aria-current={active ? 'true' : undefined}
              className="flex min-h-11 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1 transition-opacity"
              style={{
                color: primary || active ? ctx.theme.brand : ctx.theme.ink,
                opacity: primary || active ? 1 : 0.6,
              }}
            >
              <Icon className="size-[19px] shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate text-[10px] font-semibold tracking-tight">{item.label}</span>
            </a>
          )
        })}
      </nav>
    )
  }

  /* ---- `minimal` : pilule flottante, icônes seules ---- */
  if (navStyle === 'minimal') {
    return (
      <div
        className="pointer-events-none px-4 pt-12 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        style={{ backgroundImage: scrim }}
      >
        <nav
          aria-label="Navigation de la page"
          className="pointer-events-auto mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border p-1.5 shadow-[0_14px_32px_-16px_rgba(0,0,0,0.4)]"
          style={{ background: barBg, borderColor: `${ctx.theme.ink}16` }}
        >
          {items.map((item, i) => {
            const Icon = NAV_ICONS[item.icon]
            const primary = item.icon === 'plus'
            const active = i === activeIndex
            /* Cibles portées à 44 px : c'est le minimum recommandé pour un
               appui au pouce, l'ancienne version tombait à 40 px. */
            return (
              <a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'true' : undefined}
                className="flex size-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
                style={
                  primary
                    ? { background: ctx.theme.brand, color: readableOn(ctx.theme.brand) }
                    : active
                      ? { background: `${ctx.theme.ink}12`, color: ctx.theme.ink }
                      : { color: ctx.theme.ink, opacity: 0.6 }
                }
              >
                <Icon className="size-[19px] shrink-0" aria-hidden="true" />
              </a>
            )
          })}
        </nav>
      </div>
    )
  }

  /* ---- `floating` (défaut) : barre flottante, action centrale surélevée ---- */
  return (
    <div
      className="pointer-events-none px-3 pt-14 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      style={{ backgroundImage: scrim }}
    >
      <nav
        aria-label="Navigation de la page"
        className="pointer-events-auto mx-auto flex w-full max-w-md items-stretch gap-0.5 rounded-[1.75rem] border px-1.5 pt-2 pb-2 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]"
        style={{ background: barBg, borderColor: `${ctx.theme.ink}16` }}
      >
        {items.map((item, i) => {
          const Icon = NAV_ICONS[item.icon]
          const primary = item.icon === 'plus'
          const active = i === activeIndex
          if (primary) {
            return (
              <a
                key={item.id}
                href={item.href}
                aria-label={item.label}
                className="flex min-w-0 flex-1 basis-0 flex-col items-center gap-0.5"
              >
                {/* Le bouton surélevé garde sa marge négative, mais le voile
                    au-dessus (`pt-14`) lui laisse la place de dépasser sans
                    jamais sortir du cadre du téléphone. */}
                <span
                  className="-mt-7 flex size-12 shrink-0 items-center justify-center rounded-[1.25rem] shadow-lg transition-transform active:scale-95"
                  style={{
                    background: ctx.theme.brand,
                    color: readableOn(ctx.theme.brand),
                    border: `3px solid ${barBg}`,
                  }}
                >
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                </span>
                <span
                  className="max-w-full truncate text-[10px] font-bold tracking-tight"
                  style={{ color: ctx.theme.brand }}
                >
                  {item.label}
                </span>
              </a>
            )
          }
          return (
            <a
              key={item.id}
              href={item.href}
              aria-current={active ? 'true' : undefined}
              className="flex min-h-11 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-2xl px-0.5 py-1 transition-opacity"
              style={{ color: active ? ctx.theme.brand : ctx.theme.ink, opacity: active ? 1 : 0.6 }}
            >
              <Icon className="size-[19px] shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate text-[10px] font-semibold tracking-tight">{item.label}</span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
