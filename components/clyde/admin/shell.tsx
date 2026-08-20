'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Flag, GraduationCap, LayoutDashboard, Package, Users } from 'lucide-react'
import { MobileDock, type MobileDockItem } from '@/components/clyde/mobile-dock'
import { useClyde } from '@/lib/clyde/store'
import { cn } from '@/lib/utils'

const adminLinks = [
  { href: '/admin', label: 'Aperçu', icon: LayoutDashboard },
  { href: '/admin/arbitrage', label: 'Arbitrage', icon: Flag },
  { href: '/admin/echanges', label: 'Échanges', icon: Package },
  { href: '/admin/formations', label: 'Cours', icon: GraduationCap },
  { href: '/admin/abonnes', label: 'Abonnés', icon: Users },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pendingReports = useClyde((state) =>
    state.forumReports.filter((report) => !report.resolved_at).length
      + state.reviewReports.filter((report) => !report.resolved_at).length,
  )
  const pendingRedemptions = useClyde((state) =>
    state.goodieRedemptions.filter((redemption) => redemption.status !== 'remise').length,
  )
  const isActive = (href: string) => href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)

  const mobileItems: MobileDockItem[] = adminLinks.map((item) => ({
    ...item,
    key: item.href,
    active: isActive(item.href),
    badge: item.href === '/admin/arbitrage' ? pendingReports : item.href === '/admin/echanges' ? pendingRedemptions : undefined,
  }))

  return (
    <div className="min-h-dvh bg-secondary/30 pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 hidden border-b border-border bg-background/95 backdrop-blur lg:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <Link href="/admin" className="font-mono text-sm font-bold tracking-[0.18em] text-brand uppercase">
            CLYDE Admin
          </Link>
          <nav className="flex items-center gap-1" aria-label="Administration">
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  isActive(href) ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/tableau-de-bord" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            Espace vendeur
          </Link>
        </div>
      </header>
      {children}
      <MobileDock label="Navigation administration" items={mobileItems} />
    </div>
  )
}
