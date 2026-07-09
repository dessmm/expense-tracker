'use client'

import { useState } from 'react'
import { PiggyBank, BadgeInfo, Sun, Moon, Monitor } from 'lucide-react'

export function SettingsClient() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'system' | 'light' | 'dark') ?? 'system'
    }
    return 'system'
  })

  function changeTheme(newTheme: 'system' | 'light' | 'dark') {
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      if (newTheme === 'system') {
        localStorage.removeItem('theme')
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (systemDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } else {
        localStorage.setItem('theme', newTheme)
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
          Settings
        </h1>
        <p className="text-[13px] text-[#6f7881] mt-0.5">
          General preferences and configurations
        </p>
      </div>

      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-6 max-w-[600px] space-y-5 shadow-sm">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#e8f4fb] dark:bg-[#1a3040] flex items-center justify-center flex-shrink-0 text-[#006492] dark:text-[#2D9CDB]">
            <BadgeInfo className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[15px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
              Allowance Management
            </h2>
            <p className="text-[13px] text-[#6f7881] mt-1 leading-relaxed">
              We consolidated Zenith Ledger's old monthly budget features into the new <strong>Weekly Allowance</strong> model.
              This allows you to set, track, and edit your limits directly from the interactive cards on the main Dashboard.
            </p>
          </div>
        </div>

        <div className="border-t border-[#e1e3e4] dark:border-[#3a3d40] pt-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f3eafa] dark:bg-[#1e1230] flex items-center justify-center flex-shrink-0 text-[#6a3a8c]">
              <PiggyBank className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-[15px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
                Theme & Appearance
              </h2>
              <p className="text-[13px] text-[#6f7881] mt-1 leading-relaxed">
                Currencies are formatted automatically in <strong>Philippine Peso (₱)</strong>. Select your preferred app theme style below.
              </p>
            </div>
          </div>

          <div
            className="flex gap-1.5 p-1 bg-[#f3f4f5] dark:bg-[#1a1c1e] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl max-w-[380px] ml-0 sm:ml-[52px]"
          >
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map(item => {
              const Icon = item.icon
              const isSelected = theme === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => changeTheme(item.id as any)}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[13px] font-semibold transition-all cursor-pointer select-none
                    ${isSelected
                      ? 'bg-white dark:bg-[#232629] text-[#006492] dark:text-[#2D9CDB] shadow-xs border border-[#bec7d1]/50 dark:border-[#3a3d40]/50'
                      : 'text-[#6f7881] hover:text-[#191c1d] dark:hover:text-[#e2e4e5]'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
