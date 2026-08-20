'use client'

import { useState } from 'react'
import { Photo } from '@/components/clyde/photo'
import { Check, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { blockVars, shade } from '@/lib/clyde/theme'
import { demoCover } from '@/lib/clyde/demo-media'
import { useClyde, useClydeReady, useSession } from '@/lib/clyde/store'
import { type RenderCtx } from './shared'
import { type HeroBlock } from '@/lib/clyde/types'

/* Bloc 1 — Couverture. */

const HERO_H = {
  desktop: { sm: 260, md: 360, lg: 480 },
  /* Sur téléphone, une couverture trop haute repousse le contenu utile sous
     la ligne de flottaison — mais trop basse, la pastille d'identité posée
     en haut venait chevaucher le titre ancré en bas. Ces hauteurs laissent
     la place aux deux. */
  mobile: { sm: 250, md: 330, lg: 400 },
}

export function HeroRender({ block, ctx }: { block: HeroBlock; ctx: RenderCtx }) {
  const h = HERO_H[ctx.device][block.height]
  const img = block.imageUrl || demoCover(ctx.business.id)
  const [shared, setShared] = useState(false)

  /* Abonnement : le MÊME système que le cœur de la barre haute (store des
     followers), pas un doublon décoratif. Suivi réel pour un client connecté ;
     pour un visiteur anonyme, on délègue à PageSocial (dialogue d'inscription)
     via un événement — et si personne n'écoute (mockup de la landing), un
     état local fait répondre le bouton quand même. */
  const followers = useClyde((s) => s.followers)
  const toggleFollow = useClyde((s) => s.toggleFollow)
  const userId = useSession((s) => s.userId)
  const storeReady = useClydeReady()
  const [demoFollow, setDemoFollow] = useState(false)
  const following =
    storeReady && userId
      ? followers.some(
          (f) => f.business_id === ctx.business.id && f.user_id === userId,
        )
      : demoFollow

  function handleSubscribe() {
    if (userId) {
      toggleFollow(ctx.business.id, userId)
      return
    }
    const event = new CustomEvent('clyde:follow-request', { cancelable: true })
    const unhandled = window.dispatchEvent(event)
    /* dispatchEvent renvoie false si un écouteur a fait preventDefault() —
       c'est PageSocial qui prend la main. Sinon, réponse locale de démo. */
    if (unhandled) setDemoFollow((v) => !v)
  }

  /* flex-col : items-* gère l'horizontale, justify-* la verticale.
     Les variantes overlay et edge posent le texte en bas à gauche. */
  const align =
    block.variant === 'center'
      ? 'items-center justify-center text-center'
      : 'items-start justify-end'

  const logo = block.logo
  const logoEnabled = logo?.enabled !== false
  const logoUrl = logo?.url || ctx.business.logo_url
  /* Sur téléphone, les tailles hautes mangeraient la couverture entière. */
  const logoPx = ctx.device === 'mobile'
    ? { sm: 48, md: 64, lg: 84 }
    : { sm: 64, md: 84, lg: 112 }
  const size = logoPx[logo?.size ?? 'md']
  const r = size / 2
  /* L'encoche est légèrement plus large que l'avatar : c'est ce vide entre la
     couverture et le cercle qui donne l'effet « sculpté » — sans lui, l'avatar
     paraîtrait simplement posé par-dessus. */
  const notchR = r + 7
  const edgePad = 24
  const alignKey = logo?.align ?? 'left'
  /* Centre horizontal de l'encoche ET de l'avatar — le même calcul pour les
     deux, sinon le cercle sort de son creux dès qu'on change d'alignement. */
  const cx =
    alignKey === 'right'
      ? `calc(100% - ${edgePad + r}px)`
      : alignKey === 'center'
        ? '50%'
        : `${edgePad + r}px`
  /* La couverture se déforme : un cercle transparent est masqué dans son bord
     inférieur, exactement là où l'avatar la chevauche. Le fond de page
     apparaît dans le creux — la photo de profil a son propre espace au lieu
     de flotter sur l'image. */
  const notchMask = logoEnabled
    ? `radial-gradient(circle ${notchR}px at ${cx} 100%, transparent ${notchR - 0.5}px, black ${notchR + 0.5}px)`
    : undefined

  async function handleShare() {
    /* Partage natif si le navigateur le propose (mobile), sinon copie du
       lien : les deux aboutissent à la même chose — l'adresse de la page
       dans les mains du client. */
    const url = window.location.href
    const data = { title: ctx.business.name, url }
    try {
      if (navigator.share) {
        await navigator.share(data)
      } else {
        await navigator.clipboard.writeText(url)
      }
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      /* Partage annulé par l'utilisateur : rien à signaler. */
    }
  }

  return (
    <section style={blockVars(block.style, ctx.theme)} className="relative w-full !py-0">
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: h,
          maskImage: notchMask,
          WebkitMaskImage: notchMask,
        }}
      >
        {img ? (
          <Photo
            src={img}
            alt={block.title}
            fill
            priority={ctx.interactive}
            sizes="(max-width: 767px) 100vw, 760px"
            className="object-cover"
          />
        ) : (
          /* Sans photo : surface dérivée de la couleur de marque, jamais une image cassée */
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `linear-gradient(145deg, ${shade(ctx.theme.brand, 0.12)} 0%, ${ctx.theme.brand} 45%, ${shade(ctx.theme.brand, 0.55)} 100%)`,
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              block.variant === 'center'
                ? `radial-gradient(120% 100% at 50% 50%, transparent 20%, rgba(0,0,0,${block.overlay / 100}) 100%)`
                : `linear-gradient(to top, rgba(0,0,0,${Math.min(0.92, block.overlay / 100 + 0.35)}) 0%, rgba(0,0,0,${block.overlay / 200}) 55%, transparent 100%)`,
          }}
        />
        {block.variant === 'edge' && (
          <div className="absolute top-0 left-0 flex h-full items-center pl-4">
            <span
              className="font-mono text-[10px] font-bold tracking-[0.4em] text-white/80 uppercase"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {ctx.business.name}
            </span>
          </div>
        )}
        <div
          className={cn('absolute inset-0 flex flex-col gap-3 p-6', align)}
          style={{
            paddingLeft: block.variant === 'edge' ? 44 : undefined,
            /* Réserve le bas de la couverture à l'encoche : sans cette marge,
               le sous-titre glisserait sous la découpe et serait rogné. */
            paddingBottom: logoEnabled ? r + 20 : undefined,
          }}
        >
          <h1
            className="max-w-xl text-balance text-white drop-shadow-sm"
            style={{
              fontSize:
                ctx.device === 'mobile'
                  ? 'calc(1.9rem * var(--b-scale, 1))'
                  : 'calc(2.9rem * var(--b-scale, 1))',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            {block.title}
          </h1>
          {block.subtitle && (
            <p className="max-w-md text-pretty text-sm leading-relaxed text-white/85">
              {block.subtitle}
            </p>
          )}
        </div>
      </div>
      {/* Bande profil sous la couverture. L'avatar est à cheval sur le bord :
          sa moitié haute vit dans l'encoche creusée ci-dessus, sa moitié
          basse dans cette bande — l'effet des interfaces mobiles food &
          booking où le cadre se déforme pour céder la place au profil.
          Encoche et avatar suivent le même alignement (gauche / centre /
          droite) choisi dans le constructeur de page. */}
      {logoEnabled && (
        /* L'avatar est un vrai élément de la rangée, et non plus un calque en
           position absolue. Détaché du flux, il ne réservait aucune largeur :
           les boutons se plaçaient comme s'il n'existait pas et passaient
           dessous dès que la place manquait — 19 px de recouvrement sur
           l'aperçu téléphone du constructeur avec un logo en grande taille, et
           seulement 1 px d'écart en taille moyenne, donc un défaut latent à la
           moindre étiquette plus longue.

           En flux, c'est flexbox qui garantit l'écart : `shrink-0` protège le
           cercle, et le groupe de boutons se contente de la place restante. */
        <div
          className={cn(
            /* Pas de padding haut sur la rangée : il repoussait l'avatar de
               10 px vers le bas, si bien qu'il ne chevauchait la couverture que
               de 22 px au lieu de sa moitié (32 px) — le cercle flottait sous
               son encoche au lieu de s'y loger, comme sur l'aperçu de la page
               d'accueil qui sert de référence. */
            'flex gap-2 px-6',
            alignKey === 'center'
              ? 'flex-col items-center'
              : alignKey === 'right'
                ? 'flex-row-reverse items-start'
                : 'items-start',
          )}
          style={{ minHeight: r + 12 }}
        >
          <span
            className="block shrink-0 rounded-full shadow-lg"
            style={{
              width: size,
              height: size,
              /* Remonte le cercle à cheval sur la couverture : sa moitié haute
                 se loge dans l'encoche creusée au-dessus. */
              marginTop: -r,
            }}
          >
            {logoUrl ? (
              <Photo
                src={logoUrl}
                alt={`Photo de profil ${ctx.business.name}`}
                width={size}
                height={size}
                sizes={`${size}px`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center rounded-full text-lg font-bold"
                style={{
                  background: ctx.theme.brand,
                  color: '#fff',
                }}
              >
                {ctx.business.name.charAt(0)}
              </span>
            )}
          </span>
          {/* Les actions se serrent contre l'avatar, comme sur la référence de
              la page d'accueil — rejetées au bord opposé, elles laissaient un
              trou au milieu de la bande et semblaient orphelines. Sous lui
              quand il est centré. `flex-wrap` reste le filet de sécurité dans
              un cadre très étroit. */}
          <div
            className={cn(
              'flex flex-wrap items-center gap-1.5 pt-2.5',
              alignKey === 'center'
                ? 'justify-center'
                : alignKey === 'right'
                  ? 'flex-1 justify-end'
                  : 'flex-1 justify-start',
            )}
          >
            <button
              type="button"
              onClick={ctx.interactive ? handleSubscribe : undefined}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full py-1.5 text-[13px] font-semibold shadow-sm transition-transform active:scale-95',
                /* Padding resserré sur téléphone pour que les deux boutons
                   tiennent avec leur libellé à côté de l'avatar. */
                ctx.device === 'mobile' ? 'px-3' : 'px-4',
              )}
              style={
                following
                  ? {
                      background: 'transparent',
                      color: 'inherit',
                      boxShadow: `inset 0 0 0 1.5px ${ctx.theme.brand}`,
                    }
                  : { background: ctx.theme.brand, color: '#fff' }
              }
            >
              {following ? 'Abonné' : "S'abonner"}
            </button>
            {/* « Partager » garde son libellé sur téléphone, comme la
                référence : le padding resserré des deux boutons libère la place
                qui manquait, et `flex-wrap` protège les cas extrêmes. */}
            <button
              type="button"
              onClick={ctx.interactive ? handleShare : undefined}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full border py-1.5 text-[13px] font-semibold transition-transform active:scale-95',
                ctx.device === 'mobile' ? 'px-3' : 'px-4',
              )}
              style={{
                borderColor: 'color-mix(in srgb, currentColor 25%, transparent)',
              }}
            >
              {shared ? (
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Share2 className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              {shared ? 'Lien copié' : 'Partager'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
