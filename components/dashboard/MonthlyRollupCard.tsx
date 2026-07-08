'use client'

import { useMemo } from 'react'
import { formatCurrency, getWeekStartsInMonth } from '@/lib/utils'
import { BarChart3, TrendingDown, AlertTriangle } from 'lucide-react'
import type { Allowance } from '@/lib/types'

interface MonthlyRollupCardProps {
  month: string
  allowances: Allowance[]
  totalSpent: number
}

export function MonthlyRollupCard({ month, allowances, totalSpent }: MonthlyRollupCardProps) {
  // 1. Get all Mondays in the currently viewed month
  const mondays = useMemo(() => getWeekStartsInMonth(month), [month])
  const totalWeeks = mondays.length

  // 2. Sum the allowances that belong to this month
  const monthlyAllowanceTotal = useMemo(() => {
    return allowances
      .filter(a => mondays.includes(a.week_start))
      .reduce((sum, a) => sum + a.amount, 0)
  }, [allowances, mondays])

  // 3. Count how many weeks have an allowance configured
  const configuredWeeksCount = useMemo(() => {
    return allowances.filter(a => mondays.includes(a.week_start) && a.amount >= 0).length
  }, [allowances, mondays])

  // 4. Calculate remaining balance
  const remaining = monthlyAllowanceTotal - totalSpent
  const isOverAllowance = remaining < 0
  const hasAllowancesSet = configuredWeeksCount > 0

  return (
    <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex flex-col justify-between min-h-[160px]">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#e8f8ef] dark:bg-[#1a2e22] flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-[#27ae60]" strokeWidth={1.5} />
          </div>
          <span className="label-caps text-[#6f7881]">Monthly Rollup</span>
        </div>

        {/* Content rows */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[12px] text-[#6f7881]">
            <span>Monthly Allowance</span>
            <span className="font-mono text-[#191c1d] dark:text-[#e2e4e5] font-medium">
              {hasAllowancesSet ? formatCurrency(monthlyAllowanceTotal) : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center text-[12px] text-[#6f7881]">
            <span>Spent this month</span>
            <span className="font-mono text-[#191c1d] dark:text-[#e2e4e5] font-medium">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Remaining */}
      <div className="border-t border-[#e1e3e4] dark:border-[#2e3132] pt-2.5 mt-3">
        <div className="flex items-center justify-between">
          {hasAllowancesSet ? (
            isOverAllowance ? (
              <>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ca850c]" strokeWidth={1.5} />
                  <span className="text-[12px] font-medium text-[#ca850c]">Over budget</span>
                </div>
                <span className="font-mono text-[14px] font-semibold text-[#ca850c] tabular-nums">
                  {formatCurrency(Math.abs(remaining))}
                </span>
              </>
            ) : (
              <>
                <span className="text-[12px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">Remaining</span>
                <span className="font-mono text-[14px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">
                  {formatCurrency(remaining)}
                </span>
              </>
            )
          ) : (
            <>
              <span className="text-[12px] text-[#bec7d1]">Remaining</span>
              <span className="font-mono text-[14px] text-[#bec7d1]">—</span>
            </>
          )}
        </div>

        {/* Configured status */}
        <p className="text-[10px] text-[#6f7881] mt-1 text-right">
          {hasAllowancesSet
            ? `${configuredWeeksCount} of ${totalWeeks} weeks set`
            : "Set a weekly allowance to track your monthly budget"
          }
        </p>
      </div>
    </div>
  )
}
