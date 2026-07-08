'use client'

import { useMemo } from 'react'
import { formatCurrency, getTodayPHTDate, CATEGORY_COLORS } from '@/lib/utils'
import { TrendingUp, CalendarDays, Flame, BarChart2 } from 'lucide-react'
import type { Expense, Category } from '@/lib/types'

interface SpendingInsightsProps {
  expenses: Expense[]
  month: string
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Insight {
  icon: React.ReactNode
  label: string
  value: string
  subtext?: string
  accent: string // tailwind bg class for the icon wrapper
  iconColor: string // tailwind text class
}

export function SpendingInsights({ expenses, month }: SpendingInsightsProps) {
  const insights = useMemo<Insight[]>(() => {
    if (expenses.length === 0) return []

    const todayStr = getTodayPHTDate()
    const [y, m] = month.split('-').map(Number)
    // Days elapsed in month (up to today, capped at month end)
    const daysInMonth = new Date(y, m, 0).getDate()
    const todayDay = todayStr.startsWith(month)
      ? parseInt(todayStr.split('-')[2], 10)
      : daysInMonth
    const daysElapsed = Math.max(1, todayDay)

    // ── 1. PEAK DAY OF WEEK ──────────────────────────────
    const weekdayTotals: number[] = Array(7).fill(0)
    const weekdayCounts: number[] = Array(7).fill(0)
    for (const e of expenses) {
      // Use noon to avoid DST shift issues
      const [ey, em, ed] = e.date.split('-').map(Number)
      const d = new Date(ey, em - 1, ed, 12)
      const wd = d.getDay()
      weekdayTotals[wd] += e.amount
      weekdayCounts[wd]++
    }
    const weekdayAvgs = weekdayTotals.map((total, i) =>
      weekdayCounts[i] > 0 ? total / weekdayCounts[i] : 0
    )
    const peakWd = weekdayAvgs.indexOf(Math.max(...weekdayAvgs))
    const peakDayName = WEEKDAY_NAMES[peakWd]
    const peakDayAvg = weekdayAvgs[peakWd]

    // ── 2. MOST FREQUENT CATEGORY ────────────────────────
    const catCount = new Map<string, number>()
    const catTotal = new Map<string, number>()
    for (const e of expenses) {
      catCount.set(e.category, (catCount.get(e.category) ?? 0) + 1)
      catTotal.set(e.category, (catTotal.get(e.category) ?? 0) + e.amount)
    }
    let topCat = ''
    let topCount = 0
    for (const [cat, count] of catCount) {
      if (count > topCount) { topCount = count; topCat = cat }
    }
    const topCatTotal = catTotal.get(topCat) ?? 0

    // ── 3. DAILY SPEND PACE ──────────────────────────────
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
    const avgPerDay = totalSpent / daysElapsed
    const projectedTotal = avgPerDay * daysInMonth

    // ── 4. LONGEST NO-SPEND STREAK ────────────────────────
    // Build set of expense dates
    const spendDays = new Set(expenses.map(e => e.date))
    let longestStreak = 0
    let currentStreak = 0
    for (let d = 1; d <= daysElapsed; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`
      if (!spendDays.has(dateStr)) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    const result: Insight[] = []

    // Peak day insight (only if meaningful — at least 2 different weekdays with data)
    const activeDays = weekdayAvgs.filter(a => a > 0).length
    if (activeDays >= 2) {
      result.push({
        icon: <CalendarDays className="w-4 h-4" strokeWidth={1.5} />,
        label: 'Peak spending day',
        value: peakDayName,
        subtext: `avg ${formatCurrency(peakDayAvg)} / session`,
        accent: 'bg-[#e8f4fb] dark:bg-[#1a3040]',
        iconColor: 'text-[#2D9CDB]',
      })
    }

    // Top category insight
    if (topCat) {
      const dotColor = CATEGORY_COLORS[topCat as Category] || '#2D9CDB'
      result.push({
        icon: (
          <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: dotColor }} />
        ),
        label: 'Most logged category',
        value: topCat,
        subtext: `${topCount} ${topCount === 1 ? 'entry' : 'entries'} · ${formatCurrency(topCatTotal)}`,
        accent: 'bg-[#f3f4f5] dark:bg-[#1a1c1e]',
        iconColor: 'text-[#6f7881]',
      })
    }

    // Daily pace insight
    result.push({
      icon: <TrendingUp className="w-4 h-4" strokeWidth={1.5} />,
      label: 'Daily average',
      value: formatCurrency(avgPerDay),
      subtext: `≈ ${formatCurrency(projectedTotal)} projected this month`,
      accent: 'bg-[#fff8e1] dark:bg-[#2a1f0a]',
      iconColor: 'text-[#ca850c]',
    })

    // No-spend streak insight (only show if meaningful)
    if (longestStreak >= 1) {
      result.push({
        icon: <Flame className="w-4 h-4" strokeWidth={1.5} />,
        label: 'Longest no-spend streak',
        value: `${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`,
        subtext: longestStreak >= 3 ? 'Nice discipline! 🎉' : 'Keep it up!',
        accent: 'bg-[#f0fdf4] dark:bg-[#112415]',
        iconColor: 'text-[#27ae60]',
      })
    }

    return result
  }, [expenses, month])

  if (insights.length === 0) return null

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 className="w-4 h-4 text-[#6f7881]" strokeWidth={1.5} />
        <span className="text-[11px] font-bold text-[#6f7881] uppercase tracking-wider">
          Spending Patterns
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#232629] border border-[#e1e3e4] dark:border-[#3a3d40] rounded-xl p-3.5 space-y-2 shadow-sm"
          >
            <div className={`w-7 h-7 rounded-lg ${insight.accent} flex items-center justify-center ${insight.iconColor}`}>
              {insight.icon}
            </div>
            <div>
              <p className="text-[10px] text-[#6f7881] uppercase tracking-wider font-semibold leading-none mb-1">
                {insight.label}
              </p>
              <p className="text-[14px] font-bold text-[#191c1d] dark:text-[#e2e4e5] leading-tight">
                {insight.value}
              </p>
              {insight.subtext && (
                <p className="text-[10.5px] text-[#6f7881] mt-0.5 leading-snug">
                  {insight.subtext}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
