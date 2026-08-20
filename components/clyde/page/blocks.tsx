'use client'

/**
 * Répartiteur de blocs.
 *
 * Ce fichier ne contient plus que l'aiguillage : chaque type de bloc vit dans
 * son propre module sous `blocks/`. Les seize rendus tenaient auparavant dans
 * un seul fichier de 2 600 lignes, où toucher au carrousel obligeait à relire
 * la réservation, et où deux modifications simultanées se marchaient dessus.
 *
 * `RenderCtx` est ré-exporté depuis `blocks/shared` : c'est le contrat que la
 * vitrine publique et l'aperçu du constructeur partagent, et le point d'entrée
 * historique des consommateurs.
 */

import type { Block } from '@/lib/clyde/types'
import { BookingRender } from './blocks/booking'
import { BottomNavRender } from './blocks/bottom-nav'
import { CarouselRender } from './blocks/carousel'
import { CatalogueRender } from './blocks/catalogue'
import { CategoriesRender } from './blocks/categories'
import { ContactRender } from './blocks/contact'
import { FaqRender } from './blocks/faq'
import { HeroRender } from './blocks/hero'
import { HoursRender } from './blocks/hours'
import { ImageGalleryRender, IdentityMediaRender } from './blocks/media'
import { PromoRender } from './blocks/promo'
import { ReviewsRender } from './blocks/reviews'
import { SearchRender } from './blocks/search'
import { VideoRender } from './blocks/video'
import type { RenderCtx } from './blocks/shared'

export type { RenderCtx }

export function BlockRender({ block, ctx }: { block: Block; ctx: RenderCtx }) {
  if (block.hidden) return null
  switch (block.type) {
    case 'hero':
      return <HeroRender block={block} ctx={ctx} />
    case 'search':
      return <SearchRender block={block} ctx={ctx} />
    case 'categories':
      return <CategoriesRender block={block} ctx={ctx} />
    case 'catalogue':
      return <CatalogueRender block={block} ctx={ctx} />
    case 'carousel':
      return <CarouselRender block={block} ctx={ctx} />
    case 'promo':
      return <PromoRender block={block} ctx={ctx} />
    case 'booking':
      return <BookingRender block={block} ctx={ctx} />
    case 'reviews':
      return <ReviewsRender block={block} ctx={ctx} />
    case 'faq':
      return <FaqRender block={block} ctx={ctx} />
    case 'hours_location':
      return <HoursRender block={block} ctx={ctx} />
    case 'video':
      return <VideoRender block={block} ctx={ctx} />
    case 'contact':
      return <ContactRender block={block} ctx={ctx} />
    case 'identity_media':
      return <IdentityMediaRender block={block} ctx={ctx} />
    case 'image_gallery':
      return <ImageGalleryRender block={block} ctx={ctx} />
    case 'bottom_nav':
      return <BottomNavRender block={block} ctx={ctx} />
    default:
      return null
  }
}
