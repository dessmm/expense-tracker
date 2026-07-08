'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  PieChart,
  Settings,
  LogOut,
  TrendingUp,
  Coins,
  Wallet,
  Target,
  Compass,
  CalendarDays
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',            label: 'Overview',   icon: Compass },
  { href: '/dashboard',   label: 'Dashboard',  icon: TrendingUp },
  { href: '/income',      label: 'Income',     icon: Coins },
  { href: '/categories',  label: 'Categories', icon: PieChart },
  { href: '/bills',       label: 'Bills',      icon: CalendarDays },
  { href: '/budgets',     label: 'Budgets',    icon: Wallet },
  { href: '/goals',       label: 'Goals',      icon: Target },
  { href: '/settings',    label: 'Settings',   icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="
      fixed inset-y-0 left-0 z-30
      w-[260px] hidden md:flex flex-col
      bg-white dark:bg-[#232629]
      border-r border-[#bec7d1] dark:border-[#3a3d40]
    ">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[#bec7d1] dark:border-[#3a3d40]">
        <div className="w-8 h-8 rounded-lg bg-[#2D9CDB] flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-white" strokeWidth={1.5} />
        </div>
        <span className="text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
          Zenith Ledger
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors
                ${active
                  ? 'bg-[#e8f4fb] dark:bg-[#1a3040] text-[#006492] dark:text-[#2D9CDB]'
                  : 'text-[#3f4850] dark:text-[#9aacb5] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132]'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 ${active ? 'text-[#006492] dark:text-[#2D9CDB]' : 'text-[#6f7881]'}`}
                strokeWidth={1.5}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-[#bec7d1] dark:border-[#3a3d40] pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium text-[#3f4850] dark:text-[#9aacb5] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] w-full transition-colors"
        >
          <LogOut className="w-4 h-4 text-[#6f7881]" strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
