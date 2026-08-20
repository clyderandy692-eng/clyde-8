import Image from 'next/image'
import { OPTIMIZED_IMAGE_HOSTS } from '@/lib/clyde/image-hosts.mjs'

/**
 * Une image peut-elle passer par l'optimiseur de Next ?
 *
 * Oui pour les fichiers servis par l'application (`/placeholder.svg`) et pour
 * les hôtes déclarés dans la configuration. Non pour tout le reste : les URL de
 * médias sont saisies par les commerçants, et l'optimiseur répond 400 sur un
 * hôte non déclaré — ce qui remplacerait la photo par un cadre vide.
 *
 * Les `data:` et `blob:` sont exclus aussi : ce sont des aperçus locaux, déjà
 * en mémoire, que rien ne sert de faire retraverser le réseau.
 */
export function isOptimizableImage(src: string) {
  if (src.startsWith('/')) return true
  if (!src.startsWith('http')) return false
  try {
    return OPTIMIZED_IMAGE_HOSTS.includes(new URL(src).hostname)
  } catch {
    /* Une URL invalide reste affichable par le navigateur, qui est plus
       tolérant que `URL` : on la laisse passer en balise simple. */
    return false
  }
}

type CommonProps = {
  src: string
  alt: string
  className?: string
  /** Rayon, couleur de fond : les vitrines habillent leurs visuels au thème. */
  style?: React.CSSProperties
  /**
   * Image au-dessus de la ligne de flottaison.
   *
   * Sur une fiche produit, la photo *est* le plus grand élément affiché : la
   * charger paresseusement retarde le LCP de tout ce que le navigateur met à
   * découvrir la balise. Ailleurs, l'inverse est vrai.
   */
  priority?: boolean
}

type Props = CommonProps &
  (
    | {
        /** Remplit un parent positionné (`relative`) de dimensions connues. */
        fill: true
        /** Largeur réelle rendue, pour que Next choisisse la bonne source. */
        sizes: string
      }
    | {
        fill?: false
        width: number
        height: number
        /**
         * Largeur rendue, quand elle diffère des dimensions déclarées.
         *
         * Une vignette peut être décrite en 480×480 tout en n'occupant que
         * 160 px : sans cette indication, l'optimiseur sert la grande version.
         */
        sizes?: string
      }
  )

/**
 * Photo d'un contenu marchand — couverture, logo, article.
 *
 * Deux rendus derrière une seule interface : `next/image` quand l'hôte est
 * autorisé, une balise `img` sinon. Les appelants n'ont pas à trancher, et
 * n'ont surtout pas à oublier `loading` ou `decoding` sur le chemin de secours,
 * ce qui était le cas de la moitié des vitrines avant l'introduction de ce
 * composant.
 */
export function Photo(props: Props) {
  const { src, alt, className, style, priority = false } = props

  if (!isOptimizableImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- hôte non déclaré : voir isOptimizableImage
      <img
        src={src}
        alt={alt}
        className={className}
        style={
          /* En mode `fill`, `next/image` se positionne en absolu tout seul ; la
             balise de secours doit le faire à la main, sinon l'image se poserait
             au-dessus du contenu au lieu de remplir son parent. */
          props.fill
            ? {
                position: 'absolute',
                inset: 0,
                height: '100%',
                width: '100%',
                ...style,
              }
            : style
        }
        width={props.fill ? undefined : props.width}
        height={props.fill ? undefined : props.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
      />
    )
  }

  if (props.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={props.sizes}
        className={className}
        style={style}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={props.width}
      height={props.height}
      sizes={props.sizes}
      className={className}
      style={style}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
    />
  )
}
