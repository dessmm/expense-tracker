'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Wallet, Pencil, Trash2, Check, X, Loader2, AlertCircle } from 'lucide-react'
import { formatMonthLabel, navigateMonth, formatCurrency, CATEGORY_BG } from '@/lib/utils'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORIES } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import type { Expense, CategoryBudget, Category } from '@/lib/types'

interface BudgetsClientProps {
  initialMonth: string
  initialExpenses: Expense[]
  initialBudgets: CategoryBudget[]
  error?: string
}

export function BudgetsClient({
  initialMonth,
  initialExpenses,
  initialBudgets,
  error,
}: BudgetsClientProps) {
  const supabase = createClient()
  const [month, setMonth] = useState(initialMonth)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [budgets, setBudgets] = useState<CategoryBudget[]>(initialBudgets)
  const [loading, setLoading] = useState(false)

  // Inline editing state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingCategory, setSavingCategory] = useState<Category | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  async function handleMonthChange(newMonth: string) {
    setMonth(newMonth)
    setLoading(true)
    try {
      const res = await fetch(`/api/expenses?month=${newMonth}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses)
        setBudgets(data.budgets ?? [])
      }
    } catch (err) {
      console.error('Failed to load month data:', err)
    } finally {
      setLoading(false)
    }
  }

  function startEditing(category: Category, currentCap: number | null) {
    setEditingCategory(category)
    setEditValue(currentCap !== null ? String(currentCap) : '')
    setEditError(null)
  }

  function cancelEditing() {
    setEditingCategory(null)
    setEditValue('')
    setEditError(null)
  }

  async function handleSave(category: Category) {
    const rawAmount = editValue.trim()
    const amount = parseFloat(rawAmount)

    if (!rawAmount || isNaN(amount) || amount <= 0) {
      setEditError('Enter an amount greater than 0')
      return
    }

    setSavingCategory(category)
    setEditError(null)

    try {
      const res = await fetch('/api/budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, monthly_cap: amount, month }),
      })

      if (!res.ok) {
        const body = await res.json()
        setEditError(body.error ?? 'Failed to save budget')
        return
      }

      const savedBudget = await res.json()
      setBudgets(prev => {
        const exists = prev.some(b => b.category === category)
        if (exists) {
          return prev.map(b => b.category === category ? savedBudget : b)
        }
        return [...prev, savedBudget]
      })

      setEditingCategory(null)
      setEditValue('')
    } catch {
      setEditError('Network error — please try again')
    } finally {
      setSavingCategory(null)
    }
  }

  async function handleDelete(budgetId: string, category: Category) {
    if (!confirm(`Are you sure you want to remove the budget cap for ${category}?`)) return

    try {
      const res = await fetch(`/api/budgets?id=${budgetId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setBudgets(prev => prev.filter(b => b.id !== budgetId))
      } else {
        alert('Failed to delete budget cap')
      }
    } catch {
      alert('Network error')
    }
  }

  // Calculate spent per category for the current month
  const categoryData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const spent = expenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0)

      const budget = budgets.find(b => b.category === cat)
      const cap = budget ? budget.monthly_cap : null
      const budgetId = budget ? budget.id : null

      const percentage = cap ? (spent / cap) * 100 : 0
      const isOver = cap ? spent > cap : false

      return {
        category: cat,
        spent,
        cap,
        budgetId,
        percentage,
        isOver,
      }
    })
  }, [expenses, budgets])

  const hasNoBudgetsSet = budgets.length === 0

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 p-4 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-[13px] font-medium shadow-sm border border-[#ba1a1a]/10">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="text-[12px] font-bold underline hover:text-[#ba1a1a]/85 cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
            Budget Tracker
          </h1>
          <p className="text-[13px] text-[#6f7881] mt-0.5">
            Set monthly spending caps per category to prevent overspending
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg px-1 py-1 self-start sm:self-auto">
          <button
            onClick={() => handleMonthChange(navigateMonth(month, 'prev'))}
            className="p-1.5 rounded hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors text-[#6f7881]"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <span className="px-2 text-[13px] font-medium text-[#191c1d] dark:text-[#e2e4e5] min-w-[130px] text-center">
            {formatMonthLabel(month)}
          </span>
          <button
            onClick={() => handleMonthChange(navigateMonth(month, 'next'))}
            className="p-1.5 rounded hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors text-[#6f7881]"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#006492] dark:text-[#2D9CDB]" />
        </div>
      ) : (
        <>
          {/* Empty state welcome card */}
          {hasNoBudgetsSet && (
            <div className="bg-gradient-to-r from-[#e8f4fb] to-[#fffbeb] dark:from-[#1a2c3a] dark:to-[#2a2512] border border-[#bec7d1]/50 dark:border-[#3a3d40]/50 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1e2022] flex items-center justify-center shadow-sm flex-shrink-0">
                  <Wallet className="w-5 h-5 text-[#006492] dark:text-[#2D9CDB]" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
                    Set your first category spending limit!
                  </h2>
                  <p className="text-[13px] text-[#4f565b] dark:text-[#b0b3b5] mt-1 max-w-xl">
                    Budget caps help you control category-specific spending. Enter a cap for categories like Food or Transport below, and we'll warn you if you're approaching or exceeding your cap.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryData.map(({ category, spent, cap, budgetId, percentage, isOver }) => {
              const Icon = CATEGORY_ICONS[category]
              const bgClass = CATEGORY_BG[category]
              const isEditing = editingCategory === category
              const isSaving = savingCategory === category

              // Determine bar colors and labels
              let barColor = 'bg-[#2D9CDB]' // Under 80% (blue)
              let badgeStyle = 'bg-[#e8f4fb] text-[#006492] dark:bg-[#1a3040] dark:text-[#2D9CDB]'

              if (percentage >= 80 && percentage <= 100) {
                barColor = 'bg-[#ca850c]' // 80-100% (amber/warning)
                badgeStyle = 'bg-[#fffbeb] text-[#ca850c] dark:bg-[#2a2110] dark:text-[#fbbf24]'
              } else if (percentage > 100) {
                barColor = 'bg-[#ba1a1a]' // Over 100% (red/danger)
                badgeStyle = 'bg-[#fff8f7] text-[#ba1a1a] dark:bg-[#2c1516] dark:text-[#ffb4ab]'
              }

              return (
                <div
                  key={category}
                  className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex flex-col justify-between shadow-sm min-h-[170px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                        <Icon className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
                          {category}
                        </h3>
                        <p className="text-[12px] text-[#6f7881]">
                          Spent: <span className="font-mono font-medium text-[#191c1d] dark:text-[#e2e4e5]">{formatCurrency(spent)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons (if not editing) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(category, cap)}
                          title={cap !== null ? 'Edit cap' : 'Set cap'}
                          className="p-1.5 rounded-md text-[#6f7881] hover:text-[#006492] hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        {cap !== null && budgetId && (
                          <button
                            onClick={() => handleDelete(budgetId, category)}
                            title="Delete cap"
                            className="p-1.5 rounded-md text-[#6f7881] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline Cap Editor */}
                  {isEditing ? (
                    <div className="mt-4 pt-3 border-t border-[#e1e3e4] dark:border-[#2e3132] space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-[#6f7881]">₱</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') await handleSave(category)
                              if (e.key === 'Escape') cancelEditing()
                            }}
                            placeholder="Set monthly budget cap"
                            className="w-full pl-6 pr-3 py-1.5 font-mono text-[13px] text-[#191c1d] dark:text-[#e2e4e5] bg-[#f3f4f5] dark:bg-[#1a1c1e] border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg outline-none focus:border-[#2d9cdb] focus:ring-1 focus:ring-[#2d9cdb]/20"
                            autoFocus
                            disabled={isSaving}
                          />
                        </div>
                        <button
                          onClick={() => handleSave(category)}
                          disabled={isSaving}
                          className="p-1.5 bg-[#006492] hover:bg-[#004b6f] text-white rounded-lg transition-colors flex-shrink-0 disabled:opacity-60"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="p-1.5 border border-[#bec7d1] dark:border-[#3a3d40] text-[#6f7881] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] rounded-lg transition-colors flex-shrink-0 disabled:opacity-60"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {editError && <p className="text-[11px] text-[#ba1a1a]">{editError}</p>}
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t border-[#e1e3e4] dark:border-[#2e3132] space-y-3">
                      {cap !== null ? (
                        <>
                          <div className="flex items-center justify-between text-[12px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#6f7881]">Cap:</span>
                              <span className="font-mono font-semibold text-[#191c1d] dark:text-[#e2e4e5]">{formatCurrency(cap)}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${badgeStyle}`}>
                              {percentage > 100 ? (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Over budget
                                </span>
                              ) : (
                                `${Math.round(percentage)}% used`
                              )}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="h-2 bg-[#edeeef] dark:bg-[#2e3132] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-[#6f7881] italic">No cap set</span>
                          <button
                            onClick={() => startEditing(category, null)}
                            className="text-[12px] font-medium text-[#006492] dark:text-[#2D9CDB] hover:underline"
                          >
                            Set cap
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
