/**
 * Règles d'activation du commerçant.
 *
 * Ce module ne contient que des décisions — aucune formulation, aucun rendu.
 * Les libellés restent dans `i18n`, parce qu'une règle métier ne doit pas
 * changer quand on traduit une phrase, et un test ne doit pas casser quand on
 * réécrit un texte.
 *
 * Ces fonctions vivaient dans `overview.tsx`, au milieu du JSX : la règle
 * « quelle est la prochaine action utile » y était invérifiable autrement qu'à
 * l'œil, dans un composant qui exige un store et un contexte de propriétaire.
 */

/** Nombre d'articles à partir duquel une vitrine a de quoi être visitée. */
export const ACTIVATION_MIN_PRODUCTS = 3

/**
 * Étapes constatées, par opposition aux étapes déduites.
 *
 * « Trois articles » et « page publiée » se lisent dans les données. Ces deux-là
 * ne s'y lisent pas : rien dans le modèle ne dit qu'un PDF a été téléchargé ou
 * qu'un lien a été ouvert. On les enregistre donc au moment où le geste a lieu.
 */
export const ACTIVATION_QR_KEY = 'qr_downloaded'
export const ACTIVATION_SHARE_KEY = 'link_shared'

/**
 * Accueil de premier lancement déjà montré.
 *
 * Rangé avec les constats parce qu'il en est un — « cette personne a vu
 * l'accueil » — et parce que le mécanisme existant est déjà irréversible, ce
 * qu'un écran de bienvenue doit être : montré une fois, jamais rejoué.
 */
export const ACTIVATION_WELCOME_KEY = 'welcome_seen'

/** Les constats sont stockés à plat, préfixés par le commerce. */
export function activationKey(businessId: string, step: string) {
  return `${businessId}:${step}`
}

export function hasActivationCheck(
  checks: readonly string[],
  businessId: string,
  step: string,
) {
  return checks.includes(activationKey(businessId, step))
}

export type ActivationProgress = {
  itemsDone: boolean
  publishDone: boolean
  qrDone: boolean
  shareDone: boolean
  /** Étapes franchies, pour afficher une progression sans recompter. */
  doneCount: number
  allDone: boolean
}

export function activationProgress({
  businessId,
  productCount,
  published,
  checks,
}: {
  businessId: string
  productCount: number
  published: boolean
  checks: readonly string[]
}): ActivationProgress {
  const itemsDone = productCount >= ACTIVATION_MIN_PRODUCTS
  const publishDone = published
  const qrDone = hasActivationCheck(checks, businessId, ACTIVATION_QR_KEY)
  const shareDone = hasActivationCheck(checks, businessId, ACTIVATION_SHARE_KEY)
  const done = [itemsDone, publishDone, qrDone, shareDone]

  return {
    itemsDone,
    publishDone,
    qrDone,
    shareDone,
    doneCount: done.filter(Boolean).length,
    allDone: done.every(Boolean),
  }
}

/**
 * Ce qu'il reste de plus utile à faire, une fois l'activation terminée.
 *
 * L'ordre n'est pas cosmétique : une commande en attente est un client qui
 * patiente maintenant, une photo manquante est une vente moins probable plus
 * tard. On sert donc l'urgent avant l'important, et l'on ne retombe sur les
 * statistiques que lorsque rien ne réclame la main du commerçant — c'est le
 * seul cas où « regarder » vaut mieux que « faire ».
 */
export type VendorAction =
  | { kind: 'orders'; count: number; href: string }
  | { kind: 'photos'; count: number; href: string }
  | { kind: 'analytics'; count: 0; href: string }

export function nextVendorAction({
  pendingOrderCount,
  productsWithoutPhoto,
}: {
  pendingOrderCount: number
  productsWithoutPhoto: number
}): VendorAction {
  if (pendingOrderCount > 0)
    return {
      kind: 'orders',
      count: pendingOrderCount,
      href: '/tableau-de-bord/commandes',
    }

  if (productsWithoutPhoto > 0)
    return {
      kind: 'photos',
      count: productsWithoutPhoto,
      href: '/tableau-de-bord/catalogue',
    }

  return { kind: 'analytics', count: 0, href: '/tableau-de-bord/analytics' }
}

/**
 * Articles sans aucun visuel.
 *
 * `media_urls` peut contenir des chaînes vides quand un téléversement a échoué
 * en cours de route : un article dont la seule entrée est vide n'a pas de photo,
 * même si le tableau n'est pas vide.
 */
export function countProductsWithoutPhoto(
  products: readonly { media_urls: readonly string[] }[],
) {
  return products.filter(
    (product) => !product.media_urls.some((url) => url.trim() !== ''),
  ).length
}
