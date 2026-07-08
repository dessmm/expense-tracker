'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PieChart, Settings, Coins, Wallet, Target, Compass, TrendingUp, CalendarDays } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',            label: 'Overview',   icon: Compass },
  { href: '/dashboard',   label: 'Dashboard',  icon: TrendingUp },
  { href: '/income',      label: 'Income',     icon: Coins },
  { href: '/bills',       label: 'Bills',      icon: CalendarDays },
  { href: '/budgets',     label: 'Budgets',    icon: Wallet },
  { href: '/goals',       label: 'Goals',      icon: Target },
  { href: '/settings',    label: 'Settings',   icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-[#232629] border-t border-[#bec7d1] dark:border-[#3a3d40] px-4 py-2 flex justify-around items-center shadow-lg safe-bottom">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
              active
                ? 'text-[#006492] dark:text-[#2D9CDB]'
                : 'text-[#6f7881] hover:text-[#191c1d] dark:hover:text-[#e2e4e5]'
            }`}
          >
            <Icon
              className={`w-5 h-5 ${active ? 'text-[#006492] dark:text-[#2D9CDB]' : 'text-[#6f7881]'}`}
              strokeWidth={1.5}
            />
            <span className="text-[10px] font-medium tracking-tight leading-none">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
