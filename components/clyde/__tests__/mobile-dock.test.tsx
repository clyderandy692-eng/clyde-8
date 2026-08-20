/**
 * La barre basse partagée par les trois espaces.
 *
 * `mobile-dock.tsx` est consommé par `dashboard/mobile-nav.tsx`,
 * `admin/shell.tsx` et `customer/client-space.tsx`. C'est la pièce la plus
 * réutilisée de l'interface mobile, et jusqu'ici la moins protégée : les trois
 * espaces avaient chacun leur barre, elles ont été fusionnées, et rien
 * n'empêchait la fusion de se défaire.
 *
 * Les tests portent sur le contrat de l'API — ce que les appelants ont le droit
 * d'attendre — et non sur l'habillage. Une classe de couleur peut changer sans
 * casser la suite ; un élément d'action qui cesse de répondre, non.
 */

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Home, Package, Plus, Settings } from 'lucide-react'
import { DOCK_SAFE_AREA, MobileDock, type MobileDockItem } from '../mobile-dock'

function item(over: Partial<MobileDockItem> = {}): MobileDockItem {
  return { key: 'accueil', label: 'Accueil', icon: Home, href: '/', ...over }
}

const dock = (items: MobileDockItem[]) =>
  render(<MobileDock label="Navigation" items={items} />)

describe('MobileDock', () => {
  it('expose une réserve d’espace annulée au-delà de lg', () => {
    /* La valeur était recopiée dans cinq fichiers avec deux graphies : le
       dernier bouton d'une liste passait sous la barre selon l'écran. Ce test
       fige la source unique, pas la valeur exacte. */
    expect(DOCK_SAFE_AREA).toContain('lg:pb-0')
  })

  it('nomme la barre pour les lecteurs d’écran', () => {
    dock([item()])
    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeTruthy()
  })

  it('rend un lien quand l’entrée porte une adresse', () => {
    dock([item({ href: '/tableau-de-bord' })])
    const lien = screen.getByRole('link', { name: /Accueil/ })
    expect(lien.getAttribute('href')).toBe('/tableau-de-bord')
  })

  /*
   * Le cas qui a réellement échoué en production.
   *
   * Une entrée sans `href` sert à ouvrir un panneau, pas à naviguer. Elle
   * était rendue comme un lien vide : la barre semblait fonctionner et ne
   * faisait rien. Un lien exigeant une destination, ce test échouerait si
   * quelqu'un revenait à `<Link>` par défaut.
   */
  it('rend un bouton actionnable quand l’entrée n’a pas d’adresse', () => {
    const onClick = vi.fn()
    dock([item({ key: 'ajouter', label: 'Ajouter', icon: Plus, href: undefined, onClick })])

    const bouton = screen.getByRole('button', { name: /Ajouter/ })
    bouton.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('signale la page courante sur un lien et l’état enfoncé sur un bouton', () => {
    /* Deux éléments, deux conventions ARIA : `aria-current` ne veut rien dire
       sur un bouton, et `aria-pressed` ne veut rien dire sur un lien. */
    dock([
      item({ key: 'lien', label: 'Boutique', icon: Package, href: '/x', active: true }),
      item({ key: 'btn', label: 'Réglages', icon: Settings, href: undefined, active: true }),
    ])

    expect(screen.getByRole('link', { name: /Boutique/ }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: /Réglages/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('n’annonce aucun état actif quand rien n’est sélectionné', () => {
    dock([item()])
    expect(screen.getByRole('link', { name: /Accueil/ }).getAttribute('aria-current')).toBeNull()
  })

  it('plafonne le compteur à 9+ pour ne pas déformer la pastille', () => {
    dock([item({ badge: 42 })])
    expect(screen.getByText('9+')).toBeTruthy()
  })

  it('affiche le compteur tel quel en dessous de dix', () => {
    dock([item({ badge: 3 })])
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('masque la pastille quand le compteur est à zéro', () => {
    /* Un « 0 » affiché ferait croire à une notification à traiter. */
    dock([item({ badge: 0 })])
    expect(screen.queryByText('0')).toBeNull()
  })

  it('garde des cibles tactiles d’au moins 44 px', () => {
    /* `min-h-11` vaut 2,75 rem, soit 44 px : le seuil d'accessibilité pour un
       appui au pouce. Sans cette vérification, une refonte de l'habillage peut
       resserrer les cibles sans que rien ne le signale. */
    const { container } = dock([item(), item({ key: 'b', label: 'Panier', icon: Package })])
    const cibles = container.querySelectorAll('nav > a, nav > button')

    expect(cibles.length).toBe(2)
    cibles.forEach((cible) => {
      expect(cible.className).toContain('min-h-11')
    })
  })

  it('ne se montre que sous le palier lg et respecte la zone sûre', () => {
    /* Deux paliers différents (`md` ici, `lg` là) faisaient cohabiter la barre
       et le menu latéral sur tablette. Un seul palier, vérifié ici. */
    const { container } = dock([item()])
    const nav = container.querySelector('nav')

    expect(nav?.className).toContain('lg:hidden')
    expect(nav?.className).toContain('env(safe-area-inset-bottom)')
  })

  it('ouvre un menu sans naviguer quand l’entrée porte des sous-entrées', () => {
    dock([
      item({
        key: 'plus',
        label: 'Plus',
        icon: Settings,
        href: undefined,
        menuItems: [{ href: '/reglages', label: 'Réglages', icon: Settings }],
      }),
    ])

    /* Le déclencheur doit rester un bouton : rendu en lien, il emmènerait le
       commerçant hors de son écran au lieu d'ouvrir le menu. */
    expect(screen.getByRole('button', { name: 'Plus' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Plus' })).toBeNull()
  })
})
