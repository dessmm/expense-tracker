'use client'

import { useMemo } from 'react'
import { getBillDueDate, getTodayPHTDate, formatCurrency } from '@/lib/utils'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import type { RecurringBill, BillSavingsProgress } from '@/lib/types'

interface BillRemindersProps {
  bills: RecurringBill[]
  billProgress: BillSavingsProgress[]
  month: string
}

interface BillReminder {
  bill: RecurringBill
  days: number
  state: 'overdue' | 'due_soon'
  dueDate: Date
  saved: number
}

/**
 * Shows a stacked list of bill reminders due within 7 days or overdue.
 * Skips bills that are already fully saved/paid for the relevant period.
 * Returns null if no reminders are needed.
 */
export function BillReminders({ bills, billProgress, month }: BillRemindersProps) {
  const reminders = useMemo((): BillReminder[] => {
    const todayStr = getTodayPHTDate()
    const [y, m, d] = todayStr.split('-').map(Number)
    const today = new Date(y, m - 1, d, 12, 0, 0)
    const currentCalendarMonth = todayStr.slice(0, 7)

    // Hide notifications if we are not viewing the current calendar month
    if (month !== currentCalendarMonth) return []

    const list: BillReminder[] = []

    for (const bill of bills) {
      // Skip bills that haven't started yet
      if (todayStr < bill.start_date) continue

      const [startY, startM, startD] = bill.start_date.split('-').map(Number)
      const dueDay = startD
      const maxDays = new Date(y, m, 0).getDate()
      const candidateDay = Math.min(dueDay, maxDays)
      const currentDueDate = new Date(y, m - 1, candidateDay, 12, 0, 0)

      const progress = billProgress.find(p => p.bill_id === bill.id)
      const saved = progress?.amount_saved ?? 0

      if (currentDueDate < today) {
        // Due date in the current month has passed (overdue candidate)
        if (saved < bill.amount) {
          const daysOverdue = Math.round((today.getTime() - currentDueDate.getTime()) / (1000 * 60 * 60 * 24))
          list.push({
            bill,
            days: daysOverdue,
            state: 'overdue',
            dueDate: currentDueDate,
            saved,
          })
        } else {
          // Current month is fully saved. Check next due date (in the next month)
          const nextDueDate = getBillDueDate(bill.start_date)
          const msDiff = nextDueDate.getTime() - today.getTime()
          const daysUntilDue = Math.round(msDiff / (1000 * 60 * 60 * 24))
          if (daysUntilDue <= 7) {
            list.push({
              bill,
              days: daysUntilDue,
              state: 'due_soon',
              dueDate: nextDueDate,
              saved: 0, // Assume 0 saved for next month
            })
          }
        }
      } else {
        // Due date in the current month is today or in the future
        if (saved < bill.amount) {
          const daysUntilDue = Math.round((currentDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntilDue <= 7) {
            list.push({
              bill,
              days: daysUntilDue,
              state: 'due_soon',
              dueDate: currentDueDate,
              saved,
            })
          }
        }
      }
    }

    // Sort: overdue first (more days overdue first), then due_soon (sooner first)
    return list.sort((a, b) => {
      if (a.state === 'overdue' && b.state !== 'overdue') return -1
      if (a.state !== 'overdue' && b.state === 'overdue') return 1
      if (a.state === 'overdue') {
        return b.days - a.days
      }
      return a.days - b.days
    })
  }, [bills, billProgress, month])

  if (reminders.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5 mb-6">
      {reminders.map(({ bill, days, state, dueDate, saved }) => {
        const remaining = bill.amount - saved
        const formattedDueDate = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
        }).format(dueDate)

        const isOverdue = state === 'overdue'

        // Define message text based on state and days
        const message = isOverdue
          ? `${bill.name} overdue by ${days} ${days === 1 ? 'day' : 'days'} (${formattedDueDate})`
          : days === 0
          ? `${bill.name} due today (${formattedDueDate})`
          : `${bill.name} due in ${days} ${days === 1 ? 'day' : 'days'} (${formattedDueDate})`

        return (
          <div
            key={bill.id}
            className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3.5 shadow-sm transition-all duration-200 hover:translate-x-0.5 ${
              isOverdue
                ? 'bg-[#fff8f7] dark:bg-[#2c1516] border-[#ffdad6] dark:border-[#531e21] text-[#191c1d] dark:text-[#e2e4e5]'
                : 'bg-[#fffbeb] dark:bg-[#2a1f10] border-[#fef3c7] dark:border-[#4f3a1d] text-[#191c1d] dark:text-[#e2e4e5]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                {isOverdue ? (
                  <AlertCircle className="w-4 h-4 text-[#ba1a1a] dark:text-[#ffb4ab]" strokeWidth={2} />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#ca850c] dark:text-[#fbbf24]" strokeWidth={2} />
                )}
              </div>
              <span className={`text-[13px] font-medium truncate ${
                isOverdue ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#835400] dark:text-[#fbbf24]'
              }`}>
                {message}
              </span>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <span className="text-[12px] font-mono opacity-80">
                {formatCurrency(remaining)} remaining
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
