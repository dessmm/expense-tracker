'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, TrendingUp, CalendarDays, Wallet, Menu, X, Coins, Target, PieChart, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PRIMARY_ITEMS = [
  { href: '/',          label: 'Overview',   icon: Compass },
  { href: '/dashboard',   label: 'Expenses',   icon: TrendingUp },
  { href: '/bills',       label: 'Bills',      icon: CalendarDays },
  { href: '/budgets',     label: 'Budgets',    icon: Wallet },
]

const DRAWER_ITEMS = [
  { href: '/income',      label: 'Income Details', icon: Coins },
  { href: '/goals',       label: 'Savings Goals',  icon: Target },
  { href: '/categories',  label: 'Categories',     icon: PieChart },
  { href: '/settings',    label: 'Settings',       icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#232629]/95 backdrop-blur-md border-t border-[#bec7d1] dark:border-[#3a3d40] px-2 py-1 flex justify-around items-center shadow-lg safe-bottom h-16">
        {PRIMARY_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all ${
                active
                  ? 'text-[#006492] dark:text-[#2D9CDB]'
                  : 'text-[#6f7881] hover:text-[#191c1d] dark:hover:text-[#e2e4e5]'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${active ? 'text-[#006492] dark:text-[#2D9CDB]' : 'text-[#6f7881]'}`}
                strokeWidth={1.5}
              />
              <span className="text-[10px] font-semibold tracking-tight leading-none">{label}</span>
            </Link>
          )
        })}

        {/* More Button */}
        <button
          onClick={() => setDrawerOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all cursor-pointer ${
            drawerOpen
              ? 'text-[#006492] dark:text-[#2D9CDB]'
              : 'text-[#6f7881] hover:text-[#191c1d] dark:hover:text-[#e2e4e5]'
          }`}
        >
          {drawerOpen ? (
            <X className="w-5 h-5 text-[#006492] dark:text-[#2D9CDB]" strokeWidth={1.5} />
          ) : (
            <Menu className="w-5 h-5 text-[#6f7881]" strokeWidth={1.5} />
          )}
          <span className="text-[10px] font-semibold tracking-tight leading-none">More</span>
        </button>
      </nav>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-45 md:hidden bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Drawer Menu */}
      <div
        className={`
          fixed left-0 right-0 z-50 md:hidden
          bg-white dark:bg-[#232629]
          border-t border-[#bec7d1] dark:border-[#3a3d40]
          rounded-t-2xl shadow-2xl
          px-6 pt-5 pb-20
          transition-transform duration-300 ease-out
          bottom-0
          ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between mb-5 border-b border-[#bec7d1]/20 dark:border-[#3a3d40]/20 pb-3">
          <h3 className="text-[14px] font-bold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight uppercase">
            Navigation Menu
          </h3>
          <span className="text-[11px] text-[#6f7881] font-medium">Zenith Ledger</span>
        </div>

        {/* Drawer Items */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {DRAWER_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`
                  flex items-center gap-3 p-3.5 rounded-xl text-[13.5px] font-medium transition-all border
                  ${active
                    ? 'bg-[#e8f4fb] dark:bg-[#1a3040] text-[#006492] dark:text-[#2D9CDB] border-[#2D9CDB]/20'
                    : 'text-[#3f4850] dark:text-[#9aacb5] bg-[#f8f9fa] dark:bg-[#1a1c1e] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] border-transparent'
                  }
                `}
                style={{ minHeight: '48px' }} // minimum touch target size
              >
                <Icon
                  className={`w-4 h-4 ${active ? 'text-[#006492] dark:text-[#2D9CDB]' : 'text-[#6f7881]'}`}
                  strokeWidth={1.5}
                />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Action Button: Logout */}
        <div className="border-t border-[#bec7d1]/20 dark:border-[#3a3d40]/20 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 w-full p-3.5 rounded-xl text-[13.5px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/20 bg-[#ffdad6]/10 dark:bg-[#ffdad6]/5 dark:hover:bg-[#ffdad6]/15 transition-colors border border-[#ffdad6]/10 cursor-pointer"
            style={{ minHeight: '48px' }}
          >
            <LogOut className="w-4 h-4 text-[#ba1a1a]" strokeWidth={2} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}
