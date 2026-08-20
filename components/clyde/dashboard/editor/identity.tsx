/**
 * Identité de la vitrine — couverture, logo et bascules d'affichage.
 */

'use client'

import { Image } from 'lucide-react'
import { MediaUploader } from '../media-uploader'
import { useClyde } from '@/lib/clyde/store'
import { Field, ToggleRow } from './fields'
import { type Business } from '@/lib/clyde/types'

/**
 * Identité de la vitrine : couverture, logo et présence dans l'annuaire.
 *
 * La couverture ne servait nulle part alors que la marketplace en a besoin pour
 * distinguer les commerces. Elle se règle donc ici, à côté du logo.
 */
export function StorefrontIdentity({
  business,
  locale,
}: {
  business: Business
  locale: 'fr' | 'en'
}) {
  const updateBusiness = useClyde((s) => s.updateBusiness)
  const fr = locale === 'fr'

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-medium">
          {fr ? 'Identité de la vitrine' : 'Storefront identity'}
        </h3>
        <p className="text-xs text-muted-foreground">
          {fr
            ? 'Ces images représentent votre commerce dans la marketplace et en haut de votre page.'
            : 'These images represent your business in the marketplace and at the top of your page.'}
        </p>
      </div>

      <Field label={fr ? 'Image de couverture' : 'Cover image'}>
        <MediaUploader
          businessId={business.id}
          kind="cover"
          accept="image/*"
          value={business.cover_url ?? ''}
          onChange={(value) =>
            updateBusiness(business.id, {
              cover_url: (Array.isArray(value) ? value[0] : value) || null,
            })
          }
          label={fr ? 'Ajouter une couverture' : 'Add a cover'}
        />
      </Field>

      <Field label={fr ? 'Logo' : 'Logo'}>
        <MediaUploader
          businessId={business.id}
          kind="logo"
          accept="image/*"
          value={business.logo_url ?? ''}
          onChange={(value) =>
            updateBusiness(business.id, {
              logo_url: (Array.isArray(value) ? value[0] : value) || null,
            })
          }
          label={fr ? 'Ajouter un logo' : 'Add a logo'}
        />
      </Field>

      <ToggleRow
        label={fr ? 'Visible dans la marketplace' : 'Listed in the marketplace'}
        checked={business.listed_in_marketplace}
        onChange={(listed_in_marketplace) =>
          updateBusiness(business.id, { listed_in_marketplace })
        }
      />
      <ToggleRow
        label={fr ? 'Afficher le nombre d’abonnés' : 'Show follower count'}
        checked={business.followers_public}
        onChange={(followers_public) =>
          updateBusiness(business.id, { followers_public })
        }
      />
    </section>
  )
}

