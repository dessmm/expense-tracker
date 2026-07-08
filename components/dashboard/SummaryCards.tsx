import { formatCurrency } from '@/lib/utils'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { Wallet, Tag, Clock } from 'lucide-react'
import { AllowanceCard } from '@/components/dashboard/AllowanceCard'
import { MonthlyRollupCard } from '@/components/dashboard/MonthlyRollupCard'
import type { Category, Allowance } from '@/lib/types'

interface SummaryCardsProps {
  month: string
  totalSpent: number
  topCategory: Category | null
  topCategoryAmount: number
  spentThisWeek: number
  spentToday: number
  billSavingsTarget: number
  allowance: Allowance | null
  allowances: Allowance[]
  onAllowanceSaved: (allowance: Allowance) => void
  onAllowanceDeleted: () => void
}

export function SummaryCards({
  month,
  totalSpent,
  topCategory,
  topCategoryAmount,
  spentThisWeek,
  spentToday,
  billSavingsTarget,
  allowance,
  allowances,
  onAllowanceSaved,
  onAllowanceDeleted,
}: SummaryCardsProps) {
  const TopIcon = topCategory ? CATEGORY_ICONS[topCategory] : Tag

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

      {/* ── Spent today ── */}
      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex flex-col justify-between min-h-[160px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff7ed] dark:bg-[#2c1a0f] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#ea580c]" strokeWidth={1.5} />
            </div>
            <span className="label-caps text-[#6f7881]">Spent today</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight tabular-nums">
            {formatCurrency(spentToday)}
          </p>
        </div>
        <p className="text-[11px] text-[#6f7881] mt-2 border-t border-[#e1e3e4] dark:border-[#2e3132] pt-2">
          Manila Time (PHT)
        </p>
      </div>

      {/* ── Spent this month ── */}
      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex flex-col justify-between min-h-[160px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#e8f4fb] dark:bg-[#1a3040] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#006492] dark:text-[#2D9CDB]" strokeWidth={1.5} />
            </div>
            <span className="label-caps text-[#6f7881]">Spent this month</span>
          </div>
          <p className="font-mono text-2xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight tabular-nums">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <p className="text-[11px] text-[#6f7881] mt-2 border-t border-[#e1e3e4] dark:border-[#2e3132] pt-2">
          Monthly cumulative
        </p>
      </div>

      {/* ── Weekly allowance ── */}
      <AllowanceCard
        allowance={allowance}
        spentThisWeek={spentThisWeek}
        billSavingsTarget={billSavingsTarget}
        onAllowanceSaved={onAllowanceSaved}
        onAllowanceDeleted={onAllowanceDeleted}
      />

      {/* ── Monthly Rollup (replaces Budget Remaining) ── */}
      <MonthlyRollupCard
        month={month}
        allowances={allowances}
        totalSpent={totalSpent}
      />

      {/* ── Top category ── */}
      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex flex-col justify-between min-h-[160px]">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff3e0] dark:bg-[#2a1f0e] flex items-center justify-center">
              <Tag className="w-4 h-4 text-[#835400]" strokeWidth={1.5} />
            </div>
            <span className="label-caps text-[#6f7881]">Top category</span>
          </div>
          {topCategory ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#f3f4f5] dark:bg-[#2e3132] flex items-center justify-center">
                <TopIcon className="w-3.5 h-3.5 text-[#3f4850] dark:text-[#9aacb5]" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight truncate">
                {topCategory}
              </p>
            </div>
          ) : (
            <p className="text-[14px] text-[#6f7881]">No expenses yet</p>
          )}
        </div>
        <p className="text-[11px] text-[#6f7881] mt-2 border-t border-[#e1e3e4] dark:border-[#2e3132] pt-2 font-mono">
          {topCategory ? `${formatCurrency(topCategoryAmount)} total` : '—'}
        </p>
      </div>

    </div>
  )
}
