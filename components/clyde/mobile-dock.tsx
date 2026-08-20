'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type MobileDockItem = {
  key: string
  label: string
  icon: LucideIcon
  primary?: boolean
  active?: boolean
  href?: string
  onClick?: () => void
  badge?: number
  menuItems?: Array<{
    href: string
    label: string
    icon: LucideIcon
  }>
}

export function MobileDock({
  label,
  items,
}: {
  label: string
  items: MobileDockItem[]
}) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-end justify-around rounded-[1.6rem] border border-border bg-background/95 px-2 pt-2 pb-2 shadow-[0_16px_40px_-18px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:hidden"
    >
      {items.map(({ key, href, label: itemLabel, icon: Icon, primary, active, onClick, badge, menuItems }) => {
        const content = (
          <>
            <span
              className={cn(
                'relative flex items-center justify-center',
                primary
                  ? '-mt-1 h-20 w-[4.5rem] rounded-t-[2.75rem] rounded-b-[1.6rem] border-4 border-background bg-brand pt-2 shadow-lg'
                  : 'size-10',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-full',
                  primary ? 'size-10 bg-background text-brand' : active ? 'bg-brand/10 text-brand' : 'text-muted-foreground',
                )}
              >
                <Icon className={primary ? 'size-7' : 'size-5'} aria-hidden="true" />
              </span>
              {badge ? (
                <span className="absolute top-0 right-0 grid size-4 place-items-center rounded-full bg-brand font-mono text-[9px] font-bold text-brand-foreground">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </span>
            <span className={cn('max-w-full truncate', primary || active ? 'text-brand' : 'text-muted-foreground')}>
              {itemLabel}
            </span>
          </>
        )
        const className = cn(
          'flex min-h-11 min-w-14 flex-1 flex-col items-center gap-1 text-[10px] font-semibold transition-transform active:scale-95',
          primary && '-mt-8',
        )

        if (menuItems) {
          return (
            <DropdownMenu key={key}>
              <DropdownMenuTrigger
                aria-label={itemLabel}
                className={className}
                render={<button type="button" />}
              >
                {content}
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" sideOffset={14} className="min-w-56 rounded-2xl p-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Plus d’outils</DropdownMenuLabel>
                  {menuItems.map(({ href: menuHref, label: menuLabel, icon: MenuIcon }) => (
                    <DropdownMenuItem key={menuHref} className="min-h-11 rounded-xl px-3 py-2" render={<Link href={menuHref} />}>
                      <MenuIcon aria-hidden="true" />
                      {menuLabel}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        return href ? (
          <Link key={key} href={href} aria-current={active ? 'page' : undefined} className={className}>
            {content}
          </Link>
        ) : (
          <button key={key} type="button" onClick={onClick} aria-pressed={active} className={className}>
            {content}
          </button>
        )
      })}
    </nav>
  )
}
