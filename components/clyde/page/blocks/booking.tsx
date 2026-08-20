'use client'

import { useEffect, useMemo, useState } from 'react'
import { brandButton, controlSurface, insetFill, outlineButton } from '@/lib/clyde/theme'
import { useClyde } from '@/lib/clyde/store'
import { freeSlotsForDay, slotsForDay } from './booking-slots'
import { Shell, BlockTitle, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 7 — Réservation de créneaux. Le calcul des disponibilités vit dans
   `booking-slots`, sans React : c'est la partie que les tests couvrent. */

const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function BookingRender({
  block,
  ctx,
}: {
  block: Extract<Block, { type: 'booking' }>
  ctx: RenderCtx
}) {
  const days = useMemo(() => {
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    return Array.from({ length: block.daysAhead }, (_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      return d
    })
  }, [block.daysAhead])

  const [dayIdx, setDayIdx] = useState(0)
  const [slot, setSlot] = useState<string | null>(null)
  const [storeHydrated, setStoreHydrated] = useState(false)
  const day = days[dayIdx] ?? days[0]
  /* Zustand persist peut restaurer les réservations dans le navigateur avant
     le premier rendu client. Le serveur, lui, ne les connaît pas encore :
     filtrer la grille avec cette donnée externe dès le premier rendu change
     le nombre de boutons et déclenche une erreur d'hydratation. On garde donc
     la grille déterministe pendant l'hydratation, puis on applique le filtre
     dès que le store client est prêt. */
  const allBookings = useClyde((s) => s.bookings)
  useEffect(() => {
    setStoreHydrated(true)
  }, [])
  const visibleBookings = storeHydrated ? allBookings : []
  const slots = useMemo(
    () => freeSlotsForDay(ctx.availability, day, visibleBookings, ctx.business.id),
    [ctx.availability, day, visibleBookings, ctx.business.id],
  )

  /* The booking block depends on two browser-only inputs: persisted Zustand
     data and the current date. Even with a stable bookings snapshot, either
     can differ during the server/client handoff (especially around midnight
     or after a previous booking). Keep the complete first tree deterministic;
     only reveal the live calendar after hydration has finished. */
  if (!storeHydrated) {
    return (
      <Shell block={block} ctx={ctx}>
        <div className="flex flex-col gap-4" aria-busy="true">
          <div>
            <BlockTitle>{block.title}</BlockTitle>
            {block.description && (
              <p className="mt-1 text-[13px] opacity-60">{block.description}</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 @[20rem]:grid-cols-5 @[26rem]:grid-cols-7">
            {Array.from({ length: Math.min(block.daysAhead, 7) }, (_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-[var(--b-radius)] bg-current opacity-10"
              />
            ))}
          </div>
          <div className="h-10 animate-pulse rounded-[var(--b-radius)] bg-current opacity-10" />
        </div>
      </Shell>
    )
  }

  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-4">
        <div>
          <BlockTitle>{block.title}</BlockTitle>
          {block.description && (
            <p className="mt-1 text-[13px] opacity-60">{block.description}</p>
          )}
        </div>

        {/* Grille au lieu d'une bande qui défile : sur un téléphone étroit,
            aucun jour ne se retrouve coupé au bord de l'écran. */}
        <div className="grid grid-cols-4 gap-2 @[20rem]:grid-cols-5 @[26rem]:grid-cols-7">
          {days.map((d, i) => {
            const active = i === dayIdx
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={
                  ctx.interactive
                    ? () => {
                        setDayIdx(i)
                        setSlot(null)
                      }
                    : undefined
                }
                className="flex min-w-0 flex-col items-center gap-0.5 py-2.5"
                style={controlSurface(ctx.theme, { active })}
              >
                <span className="text-[10px] font-semibold tracking-wide uppercase opacity-70">
                  {DAY_SHORT[d.getDay()]}
                </span>
                <span className="text-base leading-none font-bold">{d.getDate()}</span>
              </button>
            )
          })}
        </div>

        {slots.length === 0 ? (
          <p
            className="px-3 py-6 text-center text-[13px] opacity-55"
            style={{
              borderRadius: 'var(--b-radius)',
              background: insetFill(ctx.theme),
            }}
          >
            {/* Jour ouvert mais saturé ≠ jour fermé : dire « fermé » à un
                client un samedi complet serait un mensonge démotivant. */}
            {slotsForDay(ctx.availability, day).length
              ? 'Complet ce jour-là — choisissez une autre date.'
              : 'Fermé ce jour-là — choisissez une autre date.'}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 @lg:grid-cols-4">
            {slots.map((s) => {
              const active = slot === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={ctx.interactive ? () => setSlot(s) : undefined}
                  className="py-2.5 text-[13px] font-semibold tabular-nums"
                  style={
                    /* Créneau libre : contour seul, pour que la grille reste
                       aérée et que le créneau retenu ressorte vraiment. */
                    active
                      ? controlSurface(ctx.theme, { active: true })
                      : { ...outlineButton(ctx.theme), borderRadius: 'var(--b-radius)' }
                  }
                >
                  {s}
                </button>
              )
            })}
          </div>
        )}

        <button
          type="button"
          disabled={!slot}
          onClick={
            ctx.interactive && slot
              ? () => {
                  const [h, m] = slot.split(':').map(Number)
                  const d = new Date(day)
                  d.setHours(h, m, 0, 0)
                  ctx.onBook?.(d.toISOString())
                }
              : undefined
          }
          className="w-full py-3.5 text-sm font-bold transition-transform active:scale-[0.99] disabled:opacity-40"
          style={brandButton(ctx.theme)}
        >
          {slot ? `${block.ctaLabel} — ${DAY_SHORT[day.getDay()]} ${day.getDate()} à ${slot}` : 'Choisissez un créneau'}
        </button>
      </div>
    </Shell>
  )
}
