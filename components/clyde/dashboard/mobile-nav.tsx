'use client'

import { CalendarDays, Grid2X2, Home, LayoutGrid, Plus, Search, Settings2 } from 'lucide-react'
import { MobileDock, type MobileDockItem } from '@/components/clyde/mobile-dock'
import { useEditorDock } from '@/lib/clyde/editor-dock'

const EDITOR_PATH = '/tableau-de-bord/page'

export function DashboardMobileNav({ pathname }: { pathname: string }) {
  const openPanel = useEditorDock((state) => state.open)
  const activePanel = useEditorDock((state) => state.activePanel)
  const setActivePanel = useEditorDock((state) => state.setActivePanel)
  const openEditorPanel = (panel: 'structure' | 'settings' | 'library') => {
    setActivePanel(panel)
    openPanel?.(panel)
  }
  const onEditor = pathname.startsWith(EDITOR_PATH) && Boolean(openPanel)

  const navItems: MobileDockItem[] = [
    { key: 'home', href: '/tableau-de-bord', label: 'Accueil', icon: Home, active: pathname === '/tableau-de-bord' },
    { key: 'agenda', href: '/tableau-de-bord/reservations', label: 'Agenda', icon: CalendarDays, active: pathname.startsWith('/tableau-de-bord/reservations') },
    { key: 'add', href: EDITOR_PATH, label: 'Ajouter', icon: Plus, primary: true, active: pathname.startsWith(EDITOR_PATH) },
    { key: 'catalog', href: '/tableau-de-bord/catalogue', label: 'Catalogue', icon: Search, active: pathname.startsWith('/tableau-de-bord/catalogue') },
    { key: 'more', href: '/tableau-de-bord/modules', label: 'Plus', icon: Grid2X2, active: pathname.startsWith('/tableau-de-bord/modules') },
  ]

  const editorItems: MobileDockItem[] = [
    { key: 'home', href: '/tableau-de-bord', label: 'Accueil', icon: Home },
    { key: 'structure', onClick: () => openEditorPanel('structure'), label: 'Structure', icon: LayoutGrid, active: activePanel === 'structure' },
    { key: 'add', onClick: () => openEditorPanel('library'), label: 'Ajouter', icon: Plus, primary: true, active: activePanel === 'library' },
    { key: 'settings', onClick: () => openEditorPanel('settings'), label: 'Réglages', icon: Settings2, active: activePanel === 'settings' },
    { key: 'more', href: '/tableau-de-bord/modules', label: 'Plus', icon: Grid2X2 },
  ]

  return (
    <MobileDock
      label={onEditor ? 'Outils du constructeur' : 'Navigation mobile du tableau de bord'}
      items={onEditor ? editorItems : navItems}
    />
  )
}
