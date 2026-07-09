'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import {
  formatCurrency,
  getBillDueDate,
  getWeeksRemaining,
  getTodayPHTDate,
  CATEGORY_BG
} from '@/lib/utils'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Wallet,
  Target,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Activity,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  HelpCircle,
  Plus
} from 'lucide-react'
import { IncomeModal } from '@/components/income/IncomeModal'
import type { RecurringBill, BillSavingsProgress, SavingsGoal, Allowance, CategoryBudget, Expense } from '@/lib/types'

interface OverviewClientProps {
  currentMonth: string
  previousMonth: string
  thisMonthSpent: number
  lastMonthSpent: number
  totalIncomeThisMonth: number
  allowance: Allowance | null
  spentThisWeek: number
  bills: RecurringBill[]
  billProgress: BillSavingsProgress[]
  goals: SavingsGoal[]
  budgets: CategoryBudget[]
  monthExpenses: Expense[]
  error?: string
}

export function OverviewClient({
  currentMonth,
  previousMonth,
  thisMonthSpent: initialThisMonthSpent,
  lastMonthSpent: initialLastMonthSpent,
  totalIncomeThisMonth: initialTotalIncomeThisMonth,
  allowance: initialAllowance,
  spentThisWeek: initialSpentThisWeek,
  bills: initialBills,
  billProgress: initialBillProgress,
  goals: initialGoals,
  budgets: initialBudgets,
  monthExpenses: initialMonthExpenses,
  error
}: OverviewClientProps) {
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [thisMonthSpent, setThisMonthSpent] = useState(initialThisMonthSpent)
  const [lastMonthSpent, setLastMonthSpent] = useState(initialLastMonthSpent)
  const [totalIncomeThisMonth, setTotalIncomeThisMonth] = useState(initialTotalIncomeThisMonth)
  const [allowance, setAllowance] = useState<Allowance | null>(initialAllowance)
  const [spentThisWeek, setSpentThisWeek] = useState(initialSpentThisWeek)
  const [bills, setBills] = useState<RecurringBill[]>(initialBills)
  const [billProgress, setBillProgress] = useState<BillSavingsProgress[]>(initialBillProgress)
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals)
  const [budgets, setBudgets] = useState<CategoryBudget[]>(initialBudgets)
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>(initialMonthExpenses)
  const [isCachedData, setIsCachedData] = useState(false)
  const [localError, setLocalError] = useState<string | null>(error || null)

  useEffect(() => {
    async function initOffline() {
      const { getCachedData, saveCachedData } = await import('@/lib/offline-store')
      const isOfflineMode = typeof window !== 'undefined' && !navigator.onLine

      if (error || isOfflineMode) {
        const cached = await getCachedData('overview')
        if (cached) {
          setThisMonthSpent(cached.thisMonthSpent)
          setLastMonthSpent(cached.lastMonthSpent)
          setTotalIncomeThisMonth(cached.totalIncomeThisMonth)
          setAllowance(cached.allowance)
          setSpentThisWeek(cached.spentThisWeek)
          setBills(cached.bills)
          setBillProgress(cached.billProgress)
          setGoals(cached.goals)
          setBudgets(cached.budgets)
          setMonthExpenses(cached.monthExpenses)
          setIsCachedData(true)
          setLocalError(null)
        }
      } else {
        saveCachedData('overview', {
          currentMonth,
          previousMonth,
          thisMonthSpent: initialThisMonthSpent,
          lastMonthSpent: initialLastMonthSpent,
          totalIncomeThisMonth: initialTotalIncomeThisMonth,
          allowance: initialAllowance,
          spentThisWeek: initialSpentThisWeek,
          bills: initialBills,
          billProgress: initialBillProgress,
          goals: initialGoals,
          budgets: initialBudgets,
          monthExpenses: initialMonthExpenses
        })
      }
    }

    initOffline()
  }, [error, initialThisMonthSpent, initialLastMonthSpent, initialTotalIncomeThisMonth, initialAllowance, initialSpentThisWeek, initialBills, initialBillProgress, initialGoals, initialBudgets, initialMonthExpenses, currentMonth, previousMonth])

  // ── 1. Weekly Allowance snapshot computations ───────────
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

  const hasAllowance = allowance !== null
  const weeklyAllowance = allowance?.amount ?? 0
  const availableToSpend = weeklyAllowance - billSavingsTarget - spentThisWeek
  const isOverAvailable = availableToSpend < 0
  const committedTotal = spentThisWeek + billSavingsTarget
  const committedPercent = weeklyAllowance > 0
    ? Math.min(100, Math.round((committedTotal / weeklyAllowance) * 100))
    : 0

  // ── 2. Spending Trend (MoM) ─────────────────────────────
  const momPercentDiff = useMemo(() => {
    if (lastMonthSpent === 0) return null
    const diff = ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100
    return diff
  }, [thisMonthSpent, lastMonthSpent])

  const isMoMHigher = momPercentDiff !== null && momPercentDiff > 0

  // ── 3. Upcoming Bills (top 3 soonest) ───────────────────
  const upcomingBills = useMemo(() => {
    const todayStr = getTodayPHTDate()
    const [y, m, d] = todayStr.split('-').map(Number)
    const today = new Date(y, m - 1, d, 12, 0, 0)

    return bills
      .map(bill => {
        const dueDateObj = getBillDueDate(bill.start_date)
        const daysDiff = Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        const progress = billProgress.find(p => p.bill_id === bill.id)
        const saved = progress?.amount_saved ?? 0
        const remainingToSave = Math.max(0, bill.amount - saved)

        let state: 'overdue' | 'due_soon' | 'neutral'
        if (daysDiff < 0) {
          state = 'overdue'
        } else if (daysDiff <= 7) {
          state = 'due_soon'
        } else {
          state = 'neutral'
        }

        const weeksRemaining = getWeeksRemaining(dueDateObj)
        const weeklyTarget = weeksRemaining > 0
          ? remainingToSave / weeksRemaining
          : remainingToSave

        const savedPercentage = Math.min(100, Math.round((saved / bill.amount) * 100))

        const formattedDueDate = new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
        }).format(dueDateObj)

        return {
          bill,
          dueDateObj,
          daysDiff,
          state,
          saved,
          remainingToSave,
          weeksRemaining,
          weeklyTarget,
          savedPercentage,
          formattedDueDate,
        }
      })
      .sort((a, b) => {
        if (a.state === 'overdue' && b.state !== 'overdue') return -1
        if (a.state !== 'overdue' && b.state === 'overdue') return 1
        return a.dueDateObj.getTime() - b.dueDateObj.getTime()
      })
      .slice(0, 3) // Top 3 bills
  }, [bills, billProgress])

  // Helper for bills relative time
  function formatBillRelativeTime(days: number): string {
    if (days < 0) {
      const absDays = Math.abs(days)
      return `${absDays} day${absDays === 1 ? '' : 's'} overdue`
    }
    if (days === 0) return 'due today'
    if (days === 1) return 'due tomorrow'
    if (days < 14) return `in ${days} days`
    return `in ${Math.round(days / 7)} weeks`
  }

  // ── 4. Active Savings Goals (top 3) ─────────────────────
  const activeGoals = useMemo(() => {
    const todayStr = getTodayPHTDate()
    const [y, m, d] = todayStr.split('-').map(Number)
    const today = new Date(y, m - 1, d, 12, 0, 0)

    return goals
      .map(goal => {
        const [gy, gm, gd] = goal.target_date.split('-').map(Number)
        const targetDateObj = new Date(gy, gm - 1, gd, 12, 0, 0)
        
        const weeksRemaining = getWeeksRemaining(targetDateObj)
        const remainingToSave = Math.max(0, goal.target_amount - goal.amount_saved)
        
        const weeklyTarget = weeksRemaining > 0
          ? remainingToSave / weeksRemaining
          : remainingToSave

        const savedPercentage = Math.min(100, Math.round((goal.amount_saved / goal.target_amount) * 100))

        const formattedTargetDate = new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(targetDateObj)

        const msDiff = targetDateObj.getTime() - today.getTime()
        const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24))

        return {
          goal,
          weeksRemaining,
          remainingToSave,
          weeklyTarget,
          savedPercentage,
          formattedTargetDate,
          daysDiff
        }
      })
      // sort by progress (nearest first, but active) or target date soonest
      .sort((a, b) => a.daysDiff - b.daysDiff)
      .slice(0, 3) // Top 3 goals
  }, [goals])

  function formatGoalRelativeTime(days: number): string {
    if (days < 0) return 'past target date'
    if (days === 0) return 'target date is today'
    if (days === 1) return 'target date is tomorrow'
    if (days < 14) return `in ${days} days`
    return `in ${Math.round(days / 7)} weeks`
  }

  // ── 5. Budget Caps (Over or Nearing 80%) ────────────────
  const budgetWarnings = useMemo(() => {
    // Sum expenses by category
    const categorySpentMap: Record<string, number> = {}
    for (const exp of monthExpenses) {
      const cat = exp.category ?? 'Others'
      categorySpentMap[cat] = (categorySpentMap[cat] ?? 0) + exp.amount
    }

    return budgets
      .map(budget => {
        const spent = categorySpentMap[budget.category] ?? 0
        const percentage = budget.monthly_cap > 0
          ? Math.round((spent / budget.monthly_cap) * 100)
          : 0

        return {
          budget,
          spent,
          percentage,
          isOver: spent > budget.monthly_cap,
          isNear: spent >= budget.monthly_cap * 0.8 && spent <= budget.monthly_cap
        }
      })
      .filter(item => item.isOver || item.isNear)
      .sort((a, b) => b.percentage - a.percentage) // most severe first
  }, [budgets, monthExpenses])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
            Overview
          </h1>
          <p className="text-[13px] text-[#6f7881] mt-0.5">
            Your bird's-eye financial snapshot for this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIncomeModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#e8f5e9] dark:bg-[#1b4332] hover:bg-[#c8e6c9] dark:hover:bg-[#2d6a4f] text-[#2e7d32] dark:text-[#81c784] text-[13px] font-medium rounded-lg transition-colors border border-[#a5d6a7] dark:border-[#2d6a4f]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add income
          </button>
          <Link
            href="/income"
            className="flex items-center gap-1 px-3 py-2 text-[#006492] dark:text-[#2D9CDB] text-[13px] font-medium hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      {/* Offline banner and error alert */}
      <OfflineBanner isCachedData={isCachedData} />
      {localError && (
        <div className="flex items-center gap-2.5 p-4 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-[13px] font-medium shadow-sm border border-[#ba1a1a]/10">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 flex justify-between items-center">
            <span>{localError}</span>
            <button onClick={() => window.location.reload()} className="text-[12px] font-bold underline hover:text-[#ba1a1a]/85 cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── SECTION 1: WEEKLY ALLOWANCE SNAPSHOT ───────────── */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] uppercase tracking-wider">Weekly Allowance</span>
              <span className="text-[11px] text-[#6f7881] font-mono">This Week</span>
            </div>

            {!hasAllowance ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-[13px] text-[#6f7881]">No allowance set for this week.</p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
                >
                  Configure on Dashboard <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#f3f4f5] dark:bg-[#1a1c1e] p-3 rounded-xl">
                    <p className="text-[10px] text-[#6f7881] uppercase font-semibold">Limit</p>
                    <p className="font-mono text-[14px] font-bold text-[#191c1d] dark:text-[#e2e4e5] mt-1">
                      {formatCurrency(weeklyAllowance)}
                    </p>
                  </div>
                  <div className="bg-[#f3f4f5] dark:bg-[#1a1c1e] p-3 rounded-xl">
                    <p className="text-[10px] text-[#6f7881] uppercase font-semibold">Spent</p>
                    <p className="font-mono text-[14px] font-bold text-[#191c1d] dark:text-[#e2e4e5] mt-1">
                      {formatCurrency(spentThisWeek)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${isOverAvailable ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#e8f4fb] dark:bg-[#1a3040] text-[#006492] dark:text-[#2D9CDB]'}`}>
                    <p className="text-[10px] uppercase font-semibold opacity-75">Remaining</p>
                    <p className="font-mono text-[14px] font-bold mt-1">
                      {formatCurrency(availableToSpend)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-[#6f7881]">
                    <span>Committed (Spent + Bills target)</span>
                    <span className="font-medium">{committedPercent}%</span>
                  </div>
                  <div className="h-2 bg-[#edeeef] dark:bg-[#2e3132] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isOverAvailable ? 'bg-[#ba1a1a]' : 'bg-[#006492] dark:bg-[#2D9CDB]'}`}
                      style={{ width: `${committedPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-[#e1e3e4] dark:border-[#3a3d40] pt-3 flex justify-between items-center text-[12px]">
            <span className="text-[#6f7881] font-mono text-[11px]">Bills Reserve: {formatCurrency(billSavingsTarget)}/wk</span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── SECTION 2: SPENDING TREND (MoM) ───────────────── */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] uppercase tracking-wider block">Spending Trend</span>

            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold text-[#191c1d] dark:text-[#e2e4e5]">
                  {formatCurrency(thisMonthSpent)}
                </span>
                <span className="text-[12px] text-[#6f7881]">spent this month</span>
              </div>

              {/* MoM details */}
              <div className="flex items-center gap-2">
                {momPercentDiff === null ? (
                  <span className="text-[12px] text-[#6f7881]">No spending recorded in previous month for comparison.</span>
                ) : (
                  <>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${isMoMHigher ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#e8f4fb] dark:bg-[#1a3040] text-[#006492] dark:text-[#2D9CDB]'}`}>
                      {isMoMHigher ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          <span>+{momPercentDiff.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          <span>{momPercentDiff.toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                    <span className="text-[12px] text-[#6f7881]">
                      {isMoMHigher ? 'higher' : 'lower'} than last month ({formatCurrency(lastMonthSpent)})
                    </span>
                  </>
                )}
              </div>

              {/* MoM progress comparison bar */}
              {lastMonthSpent > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-[#6f7881]">
                    <div className="w-3 h-3 rounded bg-[#2D9CDB]"></div>
                    <span>This month</span>
                    <div className="w-3 h-3 rounded bg-[#c5cbcf] dark:bg-[#4f565b] ml-2"></div>
                    <span>Last month</span>
                  </div>
                  <div className="h-4 bg-[#f3f4f5] dark:bg-[#1a1c1e] rounded-lg overflow-hidden flex">
                    <div
                      className="bg-[#2D9CDB] h-full"
                      style={{ width: `${Math.min(100, (thisMonthSpent / (thisMonthSpent + lastMonthSpent || 1)) * 100)}%` }}
                    />
                    <div
                      className="bg-[#c5cbcf] dark:bg-[#4f565b] h-full"
                      style={{ width: `${Math.min(100, (lastMonthSpent / (thisMonthSpent + lastMonthSpent || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[#e1e3e4] dark:border-[#3a3d40] pt-3 flex justify-end">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
            >
              View category breakdown <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── NET CASH FLOW (INCOME - EXPENSES) ───────────── */}
        {(() => {
          const netFlow = totalIncomeThisMonth - thisMonthSpent
          const isPositive = netFlow >= 0
          const hasIncome = totalIncomeThisMonth > 0
          return (
            <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] uppercase tracking-wider">Net Cash Flow</span>
                  <span className="text-[11px] text-[#6f7881] font-mono">This Month</span>
                </div>

                {!hasIncome ? (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-[13px] text-[#6f7881]">No income logged this month.</p>
                    <button
                      onClick={() => setIncomeModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add income entry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#e8f5e9] dark:bg-[#1b4332] p-3 rounded-xl">
                        <p className="text-[10px] text-[#2e7d32] dark:text-[#81c784] uppercase font-semibold">Income</p>
                        <p className="font-mono text-[14px] font-bold text-[#2e7d32] dark:text-[#81c784] mt-1">
                          +{formatCurrency(totalIncomeThisMonth)}
                        </p>
                      </div>
                      <div className="bg-[#f3f4f5] dark:bg-[#1a1c1e] p-3 rounded-xl">
                        <p className="text-[10px] text-[#6f7881] uppercase font-semibold">Expenses</p>
                        <p className="font-mono text-[14px] font-bold text-[#191c1d] dark:text-[#e2e4e5] mt-1">
                          -{formatCurrency(thisMonthSpent)}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${
                        isPositive
                          ? 'bg-[#e8f5e9] dark:bg-[#1b4332] text-[#2e7d32] dark:text-[#81c784]'
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}>
                        <p className="text-[10px] uppercase font-semibold opacity-75">Net</p>
                        <p className="font-mono text-[14px] font-bold mt-1">
                          {isPositive ? '+' : ''}{formatCurrency(netFlow)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-[#2e7d32] dark:text-[#81c784]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#ba1a1a]" />
                      )}
                      <span className={isPositive ? 'text-[#2e7d32] dark:text-[#81c784]' : 'text-[#ba1a1a]'}>
                        {isPositive ? 'Surplus' : 'Deficit'} of {formatCurrency(Math.abs(netFlow))} this month
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#e1e3e4] dark:border-[#3a3d40] pt-3 flex justify-end">
                <Link
                  href="/income"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
                >
                  View income log <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        })()} 

        {/* ── SECTION 3: UPCOMING BILLS ─────────────────────── */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] uppercase tracking-wider block">Upcoming Bills</span>

            {upcomingBills.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] text-[#6f7881]">No recurring bills added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBills.map(({ bill, daysDiff, saved, weeklyTarget, savedPercentage, formattedDueDate }) => {
                  const isOverdue = daysDiff < 0
                  const isDueSoon = daysDiff >= 0 && daysDiff <= 7

                  return (
                    <div key={bill.id} className="p-3 bg-[#f3f4f5] dark:bg-[#1a1c1e] rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-[13px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">{bill.name}</h4>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${isOverdue ? 'text-[#ba1a1a]' : isDueSoon ? 'text-[#ca850c]' : 'text-[#6f7881]'}`}>
                            {formatBillRelativeTime(daysDiff)} • {formattedDueDate}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[13px] font-bold text-[#191c1d] dark:text-[#e2e4e5]">
                            {formatCurrency(bill.amount)}
                          </span>
                          <p className="text-[9px] text-[#6f7881] font-mono">target: {formatCurrency(weeklyTarget)}/wk</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-[#edeeef] dark:bg-[#2e3132] rounded-full overflow-hidden flex justify-between items-center">
                        <div
                          className="h-full bg-[#27ae60] rounded-full transition-all duration-300"
                          style={{ width: `${savedPercentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-[#e1e3e4] dark:border-[#3a3d40] pt-3 flex justify-end">
            <Link
              href="/bills"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
            >
              Manage Bills & Savings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── SECTION 4: SAVINGS GOALS ──────────────────────── */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] uppercase tracking-wider block">Savings Goals</span>

            {activeGoals.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] text-[#6f7881]">No active savings goals.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeGoals.map(({ goal, daysDiff, savedPercentage, formattedTargetDate }) => (
                  <div key={goal.id} className="p-3 bg-[#f3f4f5] dark:bg-[#1a1c1e] rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-[13px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">{goal.name}</h4>
                        <span className="text-[10px] text-[#6f7881] font-mono">
                          Target: {formattedTargetDate} ({formatGoalRelativeTime(daysDiff)})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[13px] font-bold text-[#191c1d] dark:text-[#e2e4e5]">
                          {formatCurrency(goal.amount_saved)} / {formatCurrency(goal.target_amount)}
                        </span>
                        <p className="text-[9px] text-[#6f7881] font-mono">{savedPercentage}% saved</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-[#edeeef] dark:bg-[#2e3132] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#006492] dark:bg-[#2D9CDB] rounded-full transition-all duration-300"
                        style={{ width: `${savedPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#e1e3e4] dark:border-[#3a3d40] pt-3 flex justify-end">
            <Link
              href="/goals"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
            >
              Manage Savings Goals <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── SECTION 5: BUDGET CAPS WARNINGS ───────────────── */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between md:col-span-2">
          <div className="space-y-3">
            <span className="text-[13px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5] uppercase tracking-wider block">Budget Caps Status</span>

            {budgets.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-[13px] text-[#6f7881]">No budget caps configured for this month.</p>
                <Link
                  href="/budgets"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
                >
                  Set Budget Caps <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : budgetWarnings.length === 0 ? (
              <div className="p-4 bg-[#eafaf1] dark:bg-[#122c1e] text-[#27ae60] rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-[13px] font-medium">All category spending is well within your budget caps! Keep it up!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {budgetWarnings.map(({ budget, spent, percentage, isOver }) => {
                  const Icon = CATEGORY_ICONS[budget.category] ?? HelpCircle
                  const bgClass = CATEGORY_BG[budget.category] ?? 'bg-slate-100 dark:bg-slate-800'

                  return (
                    <div
                      key={budget.id}
                      className={`p-3 border rounded-xl flex items-center gap-3.5 ${
                        isOver
                          ? 'bg-[#ffdad6] border-[#ffb4ab] text-[#ba1a1a]'
                          : 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                        <Icon className="w-4 h-4 text-slate-800 dark:text-slate-200" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-[13px] font-bold truncate">{budget.category}</h4>
                          <span className="text-[11px] font-mono font-bold">{percentage}%</span>
                        </div>
                        <p className="text-[11px] font-mono mt-0.5">
                          {formatCurrency(spent)} / {formatCurrency(budget.monthly_cap)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isOver ? (
                          <AlertCircle className="w-5 h-5 text-[#ba1a1a]" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-[#ca850c]" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-[#e1e3e4] dark:border-[#3a3d40] pt-3 flex justify-end">
            <Link
              href="/budgets"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#006492] dark:text-[#2D9CDB] hover:underline"
            >
              Manage Budget Tracker <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Income Add Modal */}
      <IncomeModal
        open={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
        onSuccess={() => {
          setIncomeModalOpen(false)
          window.location.reload()
        }}
      />
    </div>
  )
}
