'use client'

import { BarChart3, CalendarDays, CreditCard, Grid2X2, Home, LayoutGrid, PackageCheck, Plus, Search, Settings2, SlidersHorizontal } from 'lucide-react'
import { MobileDock, type MobileDockItem } from '@/components/clyde/mobile-dock'
import { useEditorDock } from '@/lib/clyde/editor-dock'
import { useOwnerContext } from './use-owner'

const EDITOR_PATH = '/tableau-de-bord/page'

export function DashboardMobileNav({ pathname }: { pathname: string }) {
  /* Le mot du métier vient du même dictionnaire que la barre latérale : un
     hôtelier ne doit pas lire « Chambres » à gauche et « Catalogue » en bas. */
  const { catalogWord } = useOwnerContext()
  const openPanel = useEditorDock((state) => state.open)
  const activePanel = useEditorDock((state) => state.activePanel)
  const setActivePanel = useEditorDock((state) => state.setActivePanel)
  const openEditorPanel = (panel: 'structure' | 'settings' | 'library') => {
    setActivePanel(panel)
    openPanel?.(panel)
  }
  const onEditor = pathname.startsWith(EDITOR_PATH) && Boolean(openPanel)

  const moreItems = [
    { href: '/tableau-de-bord/commandes', label: 'Commandes', icon: PackageCheck },
    { href: '/tableau-de-bord/analytics', label: 'Statistiques', icon: BarChart3 },
    { href: '/tableau-de-bord/modules', label: 'Modules', icon: SlidersHorizontal },
    { href: '/tableau-de-bord/abonnement', label: 'Abonnement', icon: CreditCard },
  ]
  const moreActive = moreItems.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`))

  const navItems: MobileDockItem[] = [
    { key: 'home', href: '/tableau-de-bord', label: 'Accueil', icon: Home, active: pathname === '/tableau-de-bord' },
    { key: 'agenda', href: '/tableau-de-bord/reservations', label: 'Agenda', icon: CalendarDays, active: pathname.startsWith('/tableau-de-bord/reservations') },
    { key: 'add', href: EDITOR_PATH, label: 'Ajouter', icon: Plus, primary: true, active: pathname.startsWith(EDITOR_PATH) },
    { key: 'catalog', href: '/tableau-de-bord/catalogue', label: catalogWord, icon: Search, active: pathname.startsWith('/tableau-de-bord/catalogue') },
    { key: 'more', label: 'Plus', icon: Grid2X2, active: moreActive, menuItems: moreItems },
  ]

  const editorItems: MobileDockItem[] = [
    { key: 'home', href: '/tableau-de-bord', label: 'Accueil', icon: Home },
    { key: 'structure', onClick: () => openEditorPanel('structure'), label: 'Structure', icon: LayoutGrid, active: activePanel === 'structure' },
    { key: 'add', onClick: () => openEditorPanel('library'), label: 'Ajouter', icon: Plus, primary: true, active: activePanel === 'library' },
    { key: 'settings', onClick: () => openEditorPanel('settings'), label: 'Réglages', icon: Settings2, active: activePanel === 'settings' },
    { key: 'more', label: 'Plus', icon: Grid2X2, active: moreActive, menuItems: moreItems },
  ]

  return (
    <MobileDock
      label={onEditor ? 'Outils du constructeur' : 'Navigation mobile du tableau de bord'}
      items={onEditor ? editorItems : navItems}
    />
  )
}
