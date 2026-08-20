'use client'

import { useEffect, useRef, type CSSProperties } from 'react'

/* Rail défilant partagé par le carrousel et les catégories. */
export function CarouselRail({
  children,
  ariaLabel,
  itemCount,
  style,
}: {
  children: React.ReactNode
  enabled?: boolean
  ariaLabel: string
  itemCount: number
  style?: CSSProperties
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const pausedRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /* Position accumulée en flottant : `scrollLeft` est tronqué à l'entier par
     le navigateur, donc incrémenter directement scrollLeft de 0.35 px ne
     bougeait jamais le rail (0 + 0.35 → tronqué à 0, à chaque frame). */
  const posRef = useRef(0)

  useEffect(() => {
    if (itemCount < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const PX_PER_FRAME = 0.4

    const tick = () => {
      const rail = railRef.current
      if (rail && !pausedRef.current) {
        const max = rail.scrollWidth - rail.clientWidth
        if (max > 0) {
          /* Resynchronise si l'utilisateur a fait défiler à la main. */
          if (Math.abs(rail.scrollLeft - posRef.current) > 2) {
            posRef.current = rail.scrollLeft
          }
          posRef.current = posRef.current + PX_PER_FRAME >= max ? 0 : posRef.current + PX_PER_FRAME
          rail.scrollLeft = posRef.current
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [itemCount])

  /* Pause pendant l'interaction, reprise après 4 s : assez long pour lire
     une carte et cliquer dessus sans que le rail reparte sous le doigt. */
  function pause() {
    pausedRef.current = true
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
  }
  function resume() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => { pausedRef.current = false }, 4000)
  }

  /* Glisser à la souris : le défilement natif ne répond qu'au tactile et à
     la molette — à la souris, le rail semblait figé. On traduit donc le
     mouvement du pointeur en scrollLeft, et on avale le clic qui suit un
     vrai glissement pour ne pas ouvrir une carte par accident. */
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false })

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pause()
    if (e.pointerType !== 'mouse') return
    const rail = railRef.current
    if (!rail) return
    dragRef.current = { active: true, startX: e.clientX, startScroll: rail.scrollLeft, moved: false }
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    const rail = railRef.current
    if (!drag.active || !rail) return
    const delta = e.clientX - drag.startX
    if (Math.abs(delta) > 5 && !drag.moved) {
      drag.moved = true
      rail.setPointerCapture(e.pointerId)
    }
    if (drag.moved) rail.scrollLeft = drag.startScroll - delta
  }
  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (drag.active && drag.moved) {
      railRef.current?.releasePointerCapture?.(e.pointerId)
    }
    drag.active = false
    resume()
  }
  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (dragRef.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      dragRef.current.moved = false
    }
  }

  if (itemCount === 0) return null

  return (
    <div
      ref={railRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className="clyde-no-scrollbar flex cursor-grab gap-3 overflow-x-auto overscroll-x-contain pb-1 select-none active:cursor-grabbing"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClickCapture={onClickCapture}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      {children}
    </div>
  )
}
