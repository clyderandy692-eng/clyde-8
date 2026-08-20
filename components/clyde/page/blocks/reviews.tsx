'use client'

import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { brandButton, cardSurface, controlSurface, insetFill } from '@/lib/clyde/theme'
import { averageRating, businessReviews } from '@/lib/clyde/reviews'
import { useClyde, useSession } from '@/lib/clyde/store'
import { Shell, BlockTitle, Stars, type RenderCtx } from './shared'
import { type Block } from '@/lib/clyde/types'

/* Bloc 8 — Avis et témoignages. */

export function ReviewsRender({
  block,
  ctx,
}: {
  block: Extract<Block, { type: 'reviews' }>
  ctx: RenderCtx
}) {
  const [tab, setTab] = useState<'infos' | 'booking' | 'reviews'>('reviews')
  const allReviews = useClyde((s) => s.reviews)
  const createReview = useClyde((s) => s.createReview)
  const userId = useSession((s) => s.userId)
  const reportReview = useClyde((s) => s.reportReview)
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  /* Les signalements déjà envoyés depuis cet écran. Le store empêche déjà le
     doublon d'un même compte, mais un visiteur anonyme peut signaler autant de
     fois qu'il clique : ce garde-fou évite qu'il le fasse sans le voir. */
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())

  function submitReport(reviewId: string) {
    if (!ctx.interactive || reportReason.trim().length === 0) return
    reportReview({ reviewId, reporterUserId: userId, reason: reportReason })
    setReportedIds((prev) => new Set(prev).add(reviewId))
    setReportingId(null)
    setReportReason('')
  }

  /* Ce bloc ne montre que de vrais avis du commerce. Les témoignages que le
     commerçant saisissait lui-même (`block.items`) ne sont plus affichés : une
     note écrite par le vendeur sur sa propre vitrine n'informe personne. Le
     champ reste dans le type pour ne pas effacer le travail déjà saisi, mais il
     ne trompe plus le visiteur. */
  const reviews = useMemo(
    () =>
      [...businessReviews(allReviews, ctx.business.id)].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
    [allReviews, ctx.business.id],
  )
  const avg = averageRating(reviews)

  function submit() {
    if (!ctx.interactive || rating < 1 || !name.trim()) return
    createReview({
      businessId: ctx.business.id,
      /* `null` : cet emplacement recueille l'avis sur le commerce. Les avis
         d'articles se déposent sur la page de l'article. */
      productId: null,
      authorUserId: userId,
      authorName: name,
      rating,
      body,
    })
    setFormOpen(false)
    setName('')
    setRating(0)
    setBody('')
  }

  const content = (
    <div className="flex flex-col gap-2.5">
      {reviews.length === 0 ? (
        /* Aucun avis : on le dit franchement plutôt que d'afficher un bloc vide
           que le visiteur croirait cassé — et on invite à être le premier. */
        <p className="py-2 text-[13px] leading-relaxed opacity-60">
          Aucun avis pour le moment. Soyez la première personne à donner le
          vôtre.
        </p>
      ) : (
        reviews.map((r) => (
          <div key={r.id} className="p-3.5 text-left" style={{ ...cardSurface(ctx.theme) }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold">{r.author_name}</p>
              <Stars value={r.rating} />
            </div>
            {r.body ? (
              <p className="mt-1.5 text-[13px] leading-relaxed opacity-70">{r.body}</p>
            ) : null}

            {/* Le signalement existe ici aussi. Sans lui, un avis diffamatoire
                sur le commerce ne pouvait être porté à l'arbitrage depuis la
                page — seuls les avis d'articles l'étaient. */}
            <div className="mt-2 flex items-center justify-between gap-2">
              {r.moderation === 'signale' ? (
                <p className="text-[11px] opacity-60">
                  Signalé — en cours d&apos;examen par l&apos;équipe CLYDE.
                </p>
              ) : (
                <span />
              )}
              {reportedIds.has(r.id) ? (
                <span className="text-[11px] opacity-50">Signalement envoyé</span>
              ) : (
                <button
                  type="button"
                  onClick={ctx.interactive ? () => setReportingId(r.id) : undefined}
                  className="shrink-0 text-[11px] font-semibold opacity-60 underline-offset-4 hover:underline"
                >
                  Signaler
                </button>
              )}
            </div>

            {reportingId === r.id ? (
              <div className="mt-2.5 flex flex-col gap-2">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={2}
                  placeholder="Qu'est-ce qui pose problème dans cet avis ?"
                  className="w-full resize-none bg-transparent px-3 py-2 text-[13px] outline-none"
                  style={{
                    borderRadius: 'calc(var(--b-radius) * 0.6)',
                    background: insetFill(ctx.theme),
                    color: 'var(--p-ink)',
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    /* Fermé jusqu'au motif : l'équipe ne peut rien juger sur un
                       signalement muet. */
                    disabled={reportReason.trim().length === 0}
                    onClick={() => submitReport(r.id)}
                    className="px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
                    style={brandButton(ctx.theme)}
                  >
                    Envoyer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportingId(null)
                      setReportReason('')
                    }}
                    className="text-[12px] font-semibold opacity-60 underline-offset-4 hover:underline"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ))
      )}

      {formOpen ? (
        <div className="flex flex-col gap-2.5 p-3.5" style={{ ...cardSurface(ctx.theme) }}>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                onClick={ctx.interactive ? () => setRating(n) : undefined}
                className="p-0.5"
              >
                <Star
                  className="size-5"
                  style={{ color: 'var(--p-brand)' }}
                  fill={n <= rating ? 'currentColor' : 'none'}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            className="w-full bg-transparent px-3 py-2 text-[13px] outline-none"
            style={{
              borderRadius: 'calc(var(--b-radius) * 0.6)',
              background: insetFill(ctx.theme),
              color: 'var(--p-ink)',
            }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Votre expérience (facultatif)"
            className="w-full resize-none bg-transparent px-3 py-2 text-[13px] outline-none"
            style={{
              borderRadius: 'calc(var(--b-radius) * 0.6)',
              background: insetFill(ctx.theme),
              color: 'var(--p-ink)',
            }}
          />
          <button
            type="button"
            disabled={rating < 1 || !name.trim()}
            onClick={submit}
            className="w-full py-2.5 text-[13px] font-bold disabled:opacity-40"
            style={brandButton(ctx.theme)}
          >
            Publier mon avis
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={ctx.interactive ? () => setFormOpen(true) : undefined}
          className="self-start text-[13px] font-semibold underline-offset-4 hover:underline"
          style={{ color: 'var(--p-brand)' }}
        >
          Donner mon avis
        </button>
      )}
    </div>
  )

  return (
    <Shell block={block} ctx={ctx}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BlockTitle>{block.title}</BlockTitle>
          {/* La note n'apparaît qu'une fois un avis déposé : « 0,0 » sur une
              vitrine neuve donnerait à croire à un commerce mal noté. */}
          {avg !== null ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold">
              <Stars value={avg} size={14} />
              {avg.toFixed(1)}
              <span className="font-normal opacity-60">({reviews.length})</span>
            </span>
          ) : null}
        </div>

        {block.withTabs ? (
          <div className="flex flex-col gap-3">
            <div
              className="flex gap-1 p-1"
              style={{
                borderRadius: 'var(--b-radius)',
                background: insetFill(ctx.theme),
              }}
            >
              {(
                [
                  ['infos', 'Infos'],
                  ['booking', 'Réservation'],
                  ['reviews', 'Avis'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={ctx.interactive ? () => setTab(id) : undefined}
                  className="flex-1 py-2 text-[12px] font-semibold"
                  style={
                    /* Onglet au repos : transparent, la piste creusée derrière
                       lui sert déjà de fond. */
                    tab === id
                      ? controlSurface(ctx.theme, {
                          radius: 'calc(var(--b-radius) * 0.6)',
                          active: true,
                        })
                      : {
                          borderRadius: 'calc(var(--b-radius) * 0.6)',
                          background: 'transparent',
                          color: 'var(--p-ink)',
                        }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === 'reviews' && content}
            {tab === 'infos' && (
              <p className="text-[13px] leading-relaxed opacity-70">
                {ctx.business.description ?? 'Présentation à compléter.'}
              </p>
            )}
            {tab === 'booking' && (
              <p className="text-[13px] leading-relaxed opacity-70">
                Utilisez le bloc Réservation de la page pour choisir un créneau.
              </p>
            )}
          </div>
        ) : (
          content
        )}
      </div>
    </Shell>
  )
}
