'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, PiggyBank } from 'lucide-react'
import { formatMonthLabel, navigateMonth, getCurrentMonth, formatManilaTime } from '@/lib/utils'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'
import { AllowanceModal } from '@/components/allowances/AllowanceModal'
import type { Expense, Allowance } from '@/lib/types'

interface DashboardHeaderProps {
  month: string
  onMonthChange: (m: string) => void
  onExpenseAdded: (expense: Expense, template?: any) => void
  onAllowanceSaved: (allowance: Allowance) => void
}

export function DashboardHeader({
  month,
  onMonthChange,
  onExpenseAdded,
  onAllowanceSaved,
}: DashboardHeaderProps) {
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [allowanceModalOpen, setAllowanceModalOpen] = useState(false)
  const currentMonth = getCurrentMonth()
  const isCurrentMonth = month === currentMonth

  const [timeString, setTimeString] = useState('')

  useEffect(() => {
    setTimeString(formatManilaTime(new Date()))

    // Ticking interval to update time string dynamically
    const interval = setInterval(() => {
      setTimeString(formatManilaTime(new Date()))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
              Dashboard
            </h1>
            {timeString && (
              <span className="text-[11px] text-[#6f7881] bg-[#f3f4f5] dark:bg-[#2e3132] border border-[#bec7d1] dark:border-[#3a3d40] px-2.5 py-0.5 rounded-full font-mono mt-1 select-none">
                {timeString}
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#6f7881] mt-0.5">
            Track and manage your personal expenses
          </p>
        </div>

        <div className="
          sticky top-0 z-20 md:relative md:top-auto md:z-auto
          bg-[#f8f9fa]/95 dark:bg-[#1a1c1e]/95 backdrop-blur-md md:bg-transparent
          py-2.5 md:py-0
          -mx-4 px-4 sm:-mx-6 sm:px-6 md:m-0 md:p-0
          border-b border-[#bec7d1]/20 dark:border-[#3a3d40]/20 md:border-b-0
          flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto
        ">
          {/* Month selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg px-1 py-1 flex-1 sm:flex-initial justify-between">
            <button
              onClick={() => onMonthChange(navigateMonth(month, 'prev'))}
              className="p-1.5 rounded hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors text-[#6f7881]"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <span className="px-2 text-[13px] font-medium text-[#191c1d] dark:text-[#e2e4e5] min-w-[130px] text-center">
              {formatMonthLabel(month)}
            </span>
            <button
              onClick={() => onMonthChange(navigateMonth(month, 'next'))}
              disabled={isCurrentMonth}
              className="p-1.5 rounded hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors text-[#6f7881] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Add allowance — outline/secondary style so it doesn't compete with primary CTA */}
          <button
            id="add-allowance-btn"
            onClick={() => setAllowanceModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 flex-1 sm:flex-initial bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] hover:border-[#6a3a8c] hover:bg-[#f3eafa] dark:hover:bg-[#1e1230] text-[#3f4850] dark:text-[#9aacb5] hover:text-[#6a3a8c] dark:hover:text-[#c49fe0] text-[13px] font-medium rounded-lg transition-colors min-h-[40px]"
          >
            <PiggyBank className="w-4 h-4" strokeWidth={1.5} />
            Add allowance
          </button>

          {/* Add expense — primary CTA */}
          <button
            id="add-expense-btn"
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 flex-1 sm:flex-initial bg-[#006492] hover:bg-[#004b6f] text-white text-[13px] font-medium rounded-lg transition-colors min-h-[40px]"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            Add expense
          </button>
        </div>
      </div>

      <ExpenseModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={(expense, template) => {
          setExpenseModalOpen(false)
          onExpenseAdded(expense, template)
        }}
      />

      <AllowanceModal
        open={allowanceModalOpen}
        onClose={() => setAllowanceModalOpen(false)}
        onSuccess={(allowance) => {
          setAllowanceModalOpen(false)
          onAllowanceSaved(allowance)
        }}
      />
    </>
  )
}
