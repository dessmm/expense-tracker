'use client'

import { useState, useMemo, useEffect } from 'react'
import { getCurrentMonth, getCurrentWeekRange, getTodayPHTDate, getBillDueDate, getWeeksRemaining, formatMonthLabel, CATEGORY_COLORS, formatCurrency } from '@/lib/utils'
import { CATEGORIES } from '@/lib/types'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { ExpenseList } from '@/components/dashboard/ExpenseList'
import { CategoryBreakdownWidget } from '@/components/dashboard/CategoryBreakdownWidget'
import { BillReminders } from '@/components/dashboard/BillReminders'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { ExpenseFilters } from '@/components/dashboard/ExpenseFilters'
import { Loader2, X, Target, AlertCircle } from 'lucide-react'
import { RecurringSuggestions } from '@/components/dashboard/RecurringSuggestions'
import { SpendingInsights } from '@/components/dashboard/SpendingInsights'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import type { PendingExpense } from '@/lib/offline-store'
import type { Expense, Category, CategoryBreakdown, Allowance, RecurringBill, BillSavingsProgress, CategoryBudget, ExpenseTemplate } from '@/lib/types'

/** Filter shape for expense search/filtering */
interface ExpenseFilterState {
  category: string
  dateFrom: string
  dateTo: string
  search: string
}

interface DashboardClientProps {
  initialExpenses: Expense[]
  initialAllowances: Allowance[]
  initialMonth: string
  spentThisWeek: number
  allowance: Allowance | null
  initialBills: RecurringBill[]
  initialProgress: BillSavingsProgress[]
  initialBudgets: CategoryBudget[]
  initialTemplates: ExpenseTemplate[]
  lastWeekStart: string
  lastWeekEnd: string
  lastWeekSpent: number
  lastWeekAllowanceAmount: number | null
  lastWeekTopCategory: string | null
  twoWeeksAgoSpent: number
  error?: string
}

export function DashboardClient({
  initialExpenses,
  initialAllowances,
  initialMonth,
  spentThisWeek: initialWeekTotal,
  allowance: initialAllowance,
  initialBills,
  initialProgress,
  initialBudgets,
  initialTemplates,
  lastWeekStart,
  lastWeekEnd,
  lastWeekSpent,
  lastWeekAllowanceAmount,
  lastWeekTopCategory,
  twoWeeksAgoSpent,
  error,
}: DashboardClientProps) {
  const [month, setMonth] = useState(initialMonth)
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([])
  const [isCachedData, setIsCachedData] = useState(false)
  const [localError, setLocalError] = useState<string | null>(error || null)

  const [monthExpenses, setMonthExpenses] = useState<Expense[]>(
    initialExpenses.filter(e => e.date.startsWith(initialMonth))
  )

  // Weekly total — stays current-week regardless of month nav
  const [weekTotal, setWeekTotal] = useState(initialWeekTotal)
  const { weekStart, weekEnd } = getCurrentWeekRange()

  // Current week's allowance (for interactive edit/display)
  const [allowance, setAllowance] = useState<Allowance | null>(initialAllowance)

  // Viewed month's allowances list (for monthly rollup card)
  const [allowances, setAllowances] = useState<Allowance[]>(initialAllowances)

  // Viewed month's recurring bills list and savings progress
  const [bills, setBills] = useState<RecurringBill[]>(initialBills)
  const [billProgress, setBillProgress] = useState<BillSavingsProgress[]>(initialProgress)
  const [budgets, setBudgets] = useState<CategoryBudget[]>(initialBudgets)
  const [templates, setTemplates] = useState<ExpenseTemplate[]>(initialTemplates)
  const [quickAdding, setQuickAdding] = useState<string | null>(null)
  const [recapDismissed, setRecapDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dismissed_recap_week') === lastWeekStart
    }
    return false
  })

  function handleDismissRecap() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dismissed_recap_week', lastWeekStart)
    }
    setRecapDismissed(true)
  }

  // Expense filter state
  const [filters, setFilters] = useState<ExpenseFilterState>({
    category: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  useEffect(() => {
    async function initOffline() {
      const { getPendingExpenses, getCachedData } = await import('@/lib/offline-store')
      
      const pending = await getPendingExpenses()
      setPendingExpenses(pending)

      // Merge pending items into monthExpenses if they start with current month and aren't already there!
      setMonthExpenses(prev => {
        const merged = [...prev]
        let changed = false
        for (const p of pending) {
          if (p.date.startsWith(month) && !merged.some(e => e.id === p.localId)) {
            merged.unshift(p as unknown as Expense)
            changed = true
          }
        }
        return changed ? merged.sort((a, b) => b.date.localeCompare(a.date)) : prev
      })

      const isOfflineMode = typeof window !== 'undefined' && !navigator.onLine
      
      if (error || isOfflineMode) {
        const cached = await getCachedData('dashboard')
        if (cached) {
          setMonthExpenses(prev => {
            const cachedExpenses = cached.initialExpenses.filter((e: any) => e.date.startsWith(month))
            const merged = [...cachedExpenses]
            for (const p of pending) {
              if (p.date.startsWith(month) && !merged.some(e => e.id === p.localId)) {
                merged.unshift(p as unknown as Expense)
              }
            }
            return merged.sort((a, b) => b.date.localeCompare(a.date))
          })
          setWeekTotal(cached.spentThisWeek)
          setAllowance(cached.allowance)
          setAllowances(cached.initialAllowances)
          setBills(cached.initialBills)
          setBillProgress(cached.initialProgress)
          setBudgets(cached.initialBudgets)
          setTemplates(cached.initialTemplates)
          setIsCachedData(true)
          setLocalError(null)
        }
      } else {
        const { saveCachedData } = await import('@/lib/offline-store')
        saveCachedData('dashboard', {
          initialExpenses,
          initialAllowances,
          spentThisWeek: initialWeekTotal,
          allowance: initialAllowance,
          initialBills,
          initialProgress,
          initialBudgets,
          initialTemplates,
          lastWeekStart,
          lastWeekEnd,
          lastWeekSpent,
          lastWeekAllowanceAmount,
          lastWeekTopCategory,
          twoWeeksAgoSpent
        })
      }
    }

    initOffline()

    const handleSynced = (e: Event) => {
      const { localId, expense } = (e as CustomEvent).detail
      
      setPendingExpenses(prev => prev.filter(item => item.localId !== localId))
      
      setMonthExpenses(prev => 
        prev.map(item => item.id === localId ? expense : item)
      )
    }

    const handleSyncFailed = (e: Event) => {
      const { localId, error: errStr } = (e as CustomEvent).detail
      setPendingExpenses(prev => 
        prev.map(item => item.localId === localId ? { ...item, status: 'failed', error: errStr } : item)
      )
    }

    const handleStatusUpdated = (e: Event) => {
      const { localId, status } = (e as CustomEvent).detail
      setPendingExpenses(prev => 
        prev.map(item => item.localId === localId ? { ...item, status, error: undefined } : item)
      )
    }

    window.addEventListener('expense-synced', handleSynced)
    window.addEventListener('expense-sync-failed', handleSyncFailed)
    window.addEventListener('expense-sync-status-updated', handleStatusUpdated)

    return () => {
      window.removeEventListener('expense-synced', handleSynced)
      window.removeEventListener('expense-sync-failed', handleSyncFailed)
      window.removeEventListener('expense-sync-status-updated', handleStatusUpdated)
    }
  }, [error, initialExpenses, initialAllowances, initialWeekTotal, initialAllowance, initialBills, initialProgress, initialBudgets, initialTemplates, lastWeekStart, lastWeekEnd, lastWeekSpent, lastWeekAllowanceAmount, lastWeekTopCategory, twoWeeksAgoSpent, month])

  async function handleMonthChange(newMonth: string) {
    setMonth(newMonth)
    // Reset filters on month change
    setFilters({ category: '', dateFrom: '', dateTo: '', search: '' })
    
    const isOfflineMode = typeof window !== 'undefined' && !navigator.onLine
    if (isOfflineMode) {
      const { getCachedData } = await import('@/lib/offline-store')
      const cached = await getCachedData('dashboard')
      if (cached) {
        const cachedExpenses = cached.initialExpenses.filter((e: any) => e.date.startsWith(newMonth))
        const merged = [...cachedExpenses]
        for (const p of pendingExpenses) {
          if (p.date.startsWith(newMonth) && !merged.some(e => e.id === p.localId)) {
            merged.unshift(p as unknown as Expense)
          }
        }
        setMonthExpenses(merged.sort((a, b) => b.date.localeCompare(a.date)))
        setAllowances(cached.initialAllowances)
        setBillProgress(cached.initialProgress ?? [])
        setBudgets(cached.initialBudgets ?? [])
      }
      return
    }

    try {
      const res = await fetch(`/api/expenses?month=${newMonth}`)
      if (res.ok) {
        const data = await res.json()
        setMonthExpenses(data.expenses)
        setAllowances(data.allowances)
        setBillProgress(data.billProgress ?? [])
        setBudgets(data.budgets ?? [])
      }
    } catch {
      const { getCachedData } = await import('@/lib/offline-store')
      const cached = await getCachedData('dashboard')
      if (cached) {
        const cachedExpenses = cached.initialExpenses.filter((e: any) => e.date.startsWith(newMonth))
        const merged = [...cachedExpenses]
        for (const p of pendingExpenses) {
          if (p.date.startsWith(newMonth) && !merged.some(e => e.id === p.localId)) {
            merged.unshift(p as unknown as Expense)
          }
        }
        setMonthExpenses(merged.sort((a, b) => b.date.localeCompare(a.date)))
        setAllowances(cached.initialAllowances)
        setBillProgress(cached.initialProgress ?? [])
        setBudgets(cached.initialBudgets ?? [])
        setIsCachedData(true)
      }
    }
  }

  function handleExpenseAdded(expense: Expense, template?: any) {
    if (expense.date.startsWith(month)) {
      setMonthExpenses(prev => {
        if (prev.some(e => e.id === expense.id)) return prev
        return [expense, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      })
    }
    // Optimistically bump weekly total
    if (expense.date >= weekStart && expense.date <= weekEnd) {
      setWeekTotal(prev => prev + expense.amount)
    }
    if (template) {
      setTemplates(prev => [template, ...prev])
    }

    if (expense.id.toString().startsWith('pending_')) {
      import('@/lib/offline-store').then(async ({ getPendingExpenses }) => {
        const pending = await getPendingExpenses()
        setPendingExpenses(pending)
      })
    }
  }

  async function handleQuickAdd(template: ExpenseTemplate) {
    if (quickAdding) return
    setQuickAdding(template.id)

    const todayStr = getTodayPHTDate()
    const payload = {
      amount: template.amount,
      category: template.category,
      note: template.label,
      date: todayStr,
    }

    const isOfflineMode = typeof window !== 'undefined' && !navigator.onLine

    if (isOfflineMode) {
      try {
        const { queuePendingExpense, getPendingExpenses } = await import('@/lib/offline-store')
        const pending = await queuePendingExpense({
          amount: template.amount,
          category: template.category,
          description: template.label,
          date: todayStr,
          tags: null
        })
        handleExpenseAdded(pending as unknown as Expense)
        const pendingList = await getPendingExpenses()
        setPendingExpenses(pendingList)
      } catch (err) {
        console.error('Error queuing quick add expense:', err)
      } finally {
        setQuickAdding(null)
      }
      return
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const newExpense = await res.json()
        handleExpenseAdded(newExpense)
      } else {
        throw new Error('Failed to post to API')
      }
    } catch (err) {
      try {
        const { queuePendingExpense, getPendingExpenses } = await import('@/lib/offline-store')
        const pending = await queuePendingExpense({
          amount: template.amount,
          category: template.category,
          description: template.label,
          date: todayStr,
          tags: null
        })
        handleExpenseAdded(pending as unknown as Expense)
        const pendingList = await getPendingExpenses()
        setPendingExpenses(pendingList)
      } catch (queueErr) {
        console.error('Error queuing quick add expense after fetch failure:', queueErr)
      }
    } finally {
      setQuickAdding(null)
    }
  }

  async function handleDeleteTemplate(e: React.MouseEvent, templateId: string) {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/expense_templates?id=${templateId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      }
    } catch {
      // ignore
    }
  }

  function handleExpenseUpdated(updated: Expense) {
    setMonthExpenses(prev =>
      prev.map(e => e.id === updated.id ? updated : e)
        .filter(e => e.date.startsWith(month))
    )
  }

  const [undoToast, setUndoToast] = useState<{
    visible: boolean
    message: string
    data: Expense
  } | null>(null)

  function handleExpenseDeleted(id: string) {
    const removed = monthExpenses.find(e => e.id === id)
    if (removed) {
      setMonthExpenses(prev => prev.filter(e => e.id !== id))
      if (removed.date >= weekStart && removed.date <= weekEnd) {
        setWeekTotal(prev => Math.max(0, prev - removed.amount))
      }
      setUndoToast({
        visible: true,
        message: `Expense deleted.`,
        data: removed
      })
      setTimeout(() => {
        setUndoToast(prev => prev?.data.id === removed.id ? null : prev)
      }, 5000)
    }
  }

  async function handleUndoExpense() {
    if (!undoToast) return
    const exp = undoToast.data
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: exp.amount,
          category: exp.category,
          note: exp.note,
          date: exp.date
        })
      })
      if (res.ok) {
        const restored = await res.json()
        handleExpenseAdded(restored)
      }
    } catch {
      // ignore
    } finally {
      setUndoToast(null)
    }
  }

  // Allowance saved from AllowanceCard inline form
  function handleAllowanceSaved(saved: Allowance) {
    setAllowance(saved)
    // Synchronize allowances state list for the monthly rollup card
    setAllowances(prev => {
      const exists = prev.some(a => a.week_start === saved.week_start)
      if (exists) {
        return prev.map(a => a.week_start === saved.week_start ? saved : a)
      }
      return [...prev, saved]
    })
  }

  // Allowance deleted from AllowanceCard
  function handleAllowanceDeleted() {
    if (!allowance) return
    const deletedWeekStart = allowance.week_start
    setAllowance(null)
    setAllowances(prev => prev.filter(a => a.week_start !== deletedWeekStart))
  }

  // ── Calculate total weekly savings needed for all bills ──
  const billSavingsTarget = useMemo(() => {
    return bills.reduce((sum, bill) => {
      const progress = billProgress.find(p => p.bill_id === bill.id)
      const saved = progress?.amount_saved ?? 0
      const remainingToSave = Math.max(0, bill.amount - saved)

      const dueDate = getBillDueDate(bill.start_date)
      const weeksRemaining = getWeeksRemaining(dueDate)

      const target = weeksRemaining > 0
        ? remainingToSave / weeksRemaining
        : remainingToSave
      return sum + target
    }, 0)
  }, [bills, billProgress])

  // ── Summary computations ──────────────────────────────
  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses]
  )

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const map = new Map<Category, number>()
    for (const e of monthExpenses) {
      map.set(e.category as Category, (map.get(e.category as Category) ?? 0) + e.amount)
    }
    return CATEGORIES
      .filter(cat => map.has(cat))
      .map(cat => ({
        category: cat,
        amount: map.get(cat)!,
        percentage: totalSpent > 0 ? Math.round((map.get(cat)! / totalSpent) * 100) : 0,
        count: monthExpenses.filter(e => e.category === cat).length,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses, totalSpent])

  const topCategory = categoryBreakdown[0]?.category ?? null
  const topCategoryAmount = categoryBreakdown[0]?.amount ?? 0

  // ── Calculate Spent Today (PHT timezone) ───────────────
  const todayDate = getTodayPHTDate()
  const spentToday = useMemo(() => {
    return monthExpenses
      .filter(e => e.date === todayDate)
      .reduce((sum, e) => sum + e.amount, 0)
  }, [monthExpenses, todayDate])

  // ── Apply expense filters ──────────────────────────────
  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter(e => {
      if (filters.category && e.category !== filters.category) return false
      if (filters.dateFrom && e.date < filters.dateFrom) return false
      if (filters.dateTo && e.date > filters.dateTo) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !(e.note ?? '').toLowerCase().includes(q) &&
          !e.category.toLowerCase().includes(q) &&
          !(Array.isArray(e.tags)
            ? e.tags.some(tag => tag.toLowerCase().includes(q))
            : (e.tags ?? '').toLowerCase().includes(q)
          )
        ) return false
      }
      return true
    })
  }, [monthExpenses, filters])

  const hasActiveFilters = !!(filters.category || filters.dateFrom || filters.dateTo || filters.search)

  return (
    <>
      <OfflineBanner isCachedData={isCachedData} />
      {localError && (
        <div className="mb-6 flex items-center gap-2.5 p-4 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-[13px] font-medium shadow-sm border border-[#ba1a1a]/10">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 flex justify-between items-center">
            <span>{localError}</span>
            <button onClick={() => window.location.reload()} className="text-[12px] font-bold underline hover:text-[#ba1a1a]/85 cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      )}
      <DashboardHeader
        month={month}
        onMonthChange={handleMonthChange}
        onExpenseAdded={handleExpenseAdded}
        onAllowanceSaved={handleAllowanceSaved}
      />

      {/* Weekly Recap Card */}
      {lastWeekAllowanceAmount !== null && !recapDismissed && (
        (() => {
          const overspent = lastWeekSpent > lastWeekAllowanceAmount
          const difference = Math.abs(lastWeekAllowanceAmount - lastWeekSpent)
          
          let trendText = ''
          if (twoWeeksAgoSpent > 0) {
            const changePercent = Math.round((Math.abs(lastWeekSpent - twoWeeksAgoSpent) / twoWeeksAgoSpent) * 100)
            const direction = lastWeekSpent > twoWeeksAgoSpent ? 'more' : 'less'
            if (changePercent === 0) {
              trendText = `spending was identical to the week before (${formatCurrency(twoWeeksAgoSpent)})`
            } else {
              trendText = `${changePercent}% ${direction} than the week before (${formatCurrency(twoWeeksAgoSpent)})`
            }
          }

          return (
            <div className={`
              mb-6 p-4 rounded-xl border relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300
              ${overspent
                ? 'bg-[#fffbeb] dark:bg-[#2a1f10] border-[#fef3c7] dark:border-[#4f3a1d] text-[#78350f] dark:text-[#fef3c7]'
                : 'bg-[#f0fdf4] dark:bg-[#112415] border-[#dcfce7] dark:border-[#1c3f22] text-[#166534] dark:text-[#dcfce7]'
              }
            `}>
              <div className="flex items-start gap-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                  ${overspent ? 'bg-[#fef3c7] dark:bg-[#4f3a1d]' : 'bg-[#dcfce7] dark:bg-[#1c3f22]'}
                `}>
                  <Target className={`w-4 h-4 ${overspent ? 'text-[#ca850c]' : 'text-[#27ae60]'}`} strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-display font-bold tracking-tight">
                    Weekly Recap (Last Week)
                  </h4>
                  <p className="text-[12.5px] mt-0.5 opacity-90 leading-normal">
                    You spent <span className="font-mono font-bold">{formatCurrency(lastWeekSpent)}</span> of your <span className="font-mono font-bold">{formatCurrency(lastWeekAllowanceAmount)}</span> allowance last week.
                    {' '}{overspent ? (
                      <span>You overspent by <span className="font-mono font-bold">{formatCurrency(difference)}</span>. Try to keep an eye on category budgets this week!</span>
                    ) : (
                      <span>You saved <span className="font-mono font-bold">{formatCurrency(difference)}</span>! Great job staying under budget.</span>
                    )}
                  </p>
                  <p className="text-[12px] mt-1.5 opacity-80 leading-normal flex flex-wrap gap-x-2">
                    {lastWeekTopCategory && (
                      <span>• Top category: <span className="font-semibold">{lastWeekTopCategory}</span></span>
                    )}
                    {trendText && (
                      <span>• Trend: <span className="font-semibold">{trendText}</span></span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissRecap}
                className={`
                  p-1.5 rounded-lg border transition-colors self-end sm:self-auto cursor-pointer
                  ${overspent
                    ? 'border-[#fef3c7]/60 dark:border-[#4f3a1d]/60 hover:bg-[#fef3c7] dark:hover:bg-[#4f3a1d] text-[#ca850c]'
                    : 'border-[#dcfce7]/60 dark:border-[#1c3f22]/60 hover:bg-[#dcfce7] dark:hover:bg-[#1c3f22] text-[#27ae60]'
                  }
                `}
                aria-label="Dismiss recap"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          )
        })()
      )}

      {/* ── Recurring Expense Suggestions (Phase 2) ── */}
      <RecurringSuggestions
        expenses={monthExpenses}
        templates={templates}
        onTemplateSaved={(t) => setTemplates(prev => [t, ...prev])}
      />

      {/* Quick Add Templates Section */}
      {templates.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 bg-[#f8f9fa] dark:bg-[#1e2022] border border-[#bec7d1]/60 dark:border-[#3a3d40]/60 p-3 rounded-xl">
          <span className="text-[11px] font-bold text-[#6f7881] uppercase tracking-wider mr-2 select-none">Quick Add:</span>
          {templates.map(template => {
            const isAddingThis = quickAdding === template.id
            return (
              <button
                key={template.id}
                onClick={() => handleQuickAdd(template)}
                disabled={!!quickAdding}
                className="
                  group flex items-center gap-1.5 px-3 py-1.5
                  bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40]
                  hover:border-[#006492] hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040]
                  rounded-full text-[12px] font-medium text-[#191c1d] dark:text-[#e2e4e5]
                  transition-colors cursor-pointer select-none disabled:opacity-50
                "
              >
                {isAddingThis ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#006492] dark:text-[#2D9CDB]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[template.category as Category] || '#2D9CDB' }} />
                )}
                <span>{template.label}</span>
                <span className="font-mono text-[#6f7881] group-hover:text-[#006492] dark:group-hover:text-[#2D9CDB]">₱{template.amount}</span>
                
                {/* Delete template button */}
                <span
                  onClick={(e) => handleDeleteTemplate(e, template.id)}
                  className="ml-1 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#bec7d1] hover:text-[#ba1a1a] transition-colors"
                  title="Delete template"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Bill due-date reminders */}
      <BillReminders bills={bills} billProgress={billProgress} month={month} />

      <SummaryCards
        month={month}
        totalSpent={totalSpent}
        topCategory={topCategory}
        topCategoryAmount={topCategoryAmount}
        spentThisWeek={weekTotal}
        spentToday={spentToday}
        billSavingsTarget={billSavingsTarget}
        allowance={allowance}
        allowances={allowances}
        onAllowanceSaved={handleAllowanceSaved}
        onAllowanceDeleted={handleAllowanceDeleted}
      />

      {/* Daily spending chart */}
      <SpendingChart expenses={monthExpenses} month={month} />

      {/* Spending pattern insights */}
      <SpendingInsights expenses={monthExpenses} month={month} />

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Expenses list (wider) */}
        <div className="w-full lg:flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
              Recent Expenses
            </h2>
            <span className="label-caps text-[#6f7881]">
              {hasActiveFilters
                ? `${filteredExpenses.length} of ${monthExpenses.length} ${monthExpenses.length === 1 ? 'entry' : 'entries'}`
                : `${monthExpenses.length} ${monthExpenses.length === 1 ? 'entry' : 'entries'}`
              }
            </span>
          </div>

          {/* Filters */}
          <ExpenseFilters
            expenses={monthExpenses}
            filters={filters}
            onFilterChange={setFilters}
          />

          <ExpenseList
            expenses={filteredExpenses}
            pendingExpenses={pendingExpenses}
            onUpdate={handleExpenseUpdated}
            onDelete={handleExpenseDeleted}
          />
        </div>

        {/* Category breakdown (narrower) */}
        <div className="w-full lg:w-[280px] lg:flex-shrink-0 lg:sticky lg:top-8">
          <div className="mb-3">
            <h2 className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
              By Category
            </h2>
          </div>
          <CategoryBreakdownWidget data={categoryBreakdown} total={totalSpent} budgets={budgets} />
        </div>
      </div>

      {undoToast && undoToast.visible && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-[#191c1d] dark:bg-[#e2e4e5] text-white dark:text-[#191c1d] rounded-xl shadow-lg border border-white/10 dark:border-black/10 min-w-[280px] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-[13px] font-medium">{undoToast.message}</span>
          <button
            onClick={handleUndoExpense}
            className="text-[13px] font-bold text-[#2D9CDB] hover:text-[#006492] dark:hover:text-[#54b4eb] cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </>
  )
}
