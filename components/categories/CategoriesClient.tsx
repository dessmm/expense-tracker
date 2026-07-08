'use client'

import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatMonthLabel, navigateMonth, getCurrentMonth } from '@/lib/utils'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_COLORS, CATEGORY_BG } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Printer, AlertCircle } from 'lucide-react'
import { CATEGORIES } from '@/lib/types'
import type { Expense, Category, CategoryBreakdown } from '@/lib/types'

interface CategoriesClientProps {
  initialExpenses: Expense[]
  initialMonth: string
  error?: string
}

export function CategoriesClient({ initialExpenses, initialMonth, error }: CategoriesClientProps) {
  const [month, setMonth] = useState(initialMonth)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const currentMonth = getCurrentMonth()

  async function handleMonthChange(newMonth: string) {
    setMonth(newMonth)
    const res = await fetch(`/api/expenses?month=${newMonth}`)
    if (res.ok) {
      const data = await res.json()
      setExpenses(data.expenses)
    }
  }

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  const breakdown = useMemo((): CategoryBreakdown[] => {
    const map = new Map<Category, number>()
    for (const e of expenses) {
      map.set(e.category as Category, (map.get(e.category as Category) ?? 0) + e.amount)
    }
    return CATEGORIES
      .filter(cat => map.has(cat))
      .map(cat => ({
        category: cat,
        amount: map.get(cat)!,
        percentage: totalSpent > 0 ? Math.round((map.get(cat)! / totalSpent) * 100) : 0,
        count: expenses.filter(e => e.category === cat).length,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses, totalSpent])

  const chartData = breakdown.map(b => ({
    name: b.category,
    value: b.amount,
    color: CATEGORY_COLORS[b.category as Category],
  }))

  return (
    <>
      {error && (
        <div className="mb-6 flex items-center gap-2.5 p-4 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-[13px] font-medium shadow-sm border border-[#ba1a1a]/10">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="text-[12px] font-bold underline hover:text-[#ba1a1a]/85 cursor-pointer">
              Retry
            </button>
          </div>
        </div>
      )}
      <style>{`
        @media print {
          /* Hide sidebar, bottom bar, buttons */
          aside,
          nav,
          button,
          [title*="Print or export"],
          .flex.items-center.gap-3 {
            display: none !important;
          }
          
          /* Reset layout styles */
          body, html, main {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          
          main {
            margin-left: 0 !important;
            padding: 20px !important;
          }

          /* Force grid columns to stack on print */
          .report-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }

          /* Prevent cards from breaking across pages */
          .rounded-xl {
            page-break-inside: avoid !important;
            border: 1px solid #cbd5e1 !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
            Categories
          </h1>
          <p className="text-[13px] text-[#6f7881] mt-0.5">
            Spending breakdown by category
          </p>
        </div>

        {/* Month selector and Print */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] text-[#3f4850] dark:text-[#9aacb5] hover:text-[#006492] dark:hover:text-[#2D9CDB] text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
            title="Print or export report to PDF"
          >
            <Printer className="w-4 h-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Print Report</span>
          </button>

          <div className="flex items-center gap-1 bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg px-1 py-1">
            <button
              onClick={() => handleMonthChange(navigateMonth(month, 'prev'))}
              className="p-1.5 rounded hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors text-[#6f7881]"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <span className="px-2 text-[13px] font-medium text-[#191c1d] dark:text-[#e2e4e5] min-w-[130px] text-center">
              {formatMonthLabel(month)}
            </span>
            <button
              onClick={() => handleMonthChange(navigateMonth(month, 'next'))}
              disabled={month === currentMonth}
              className="p-1.5 rounded hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors text-[#6f7881] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {breakdown.length === 0 ? (
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-16 text-center">
          <p className="text-[15px] text-[#6f7881]">No expenses for {formatMonthLabel(month)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 report-grid">
          {/* Donut chart */}
          <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-6">
            <h2 className="text-[13px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] mb-4">
              Spend by Category
            </h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [typeof value === 'number' ? formatCurrency(value) : value, 'Amount']}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #bec7d1',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <Legend
                    formatter={(value) => <span className="text-[12px] text-[#3f4850]">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Total */}
            <div className="mt-2 pt-4 border-t border-[#e1e3e4] dark:border-[#3a3d40] flex justify-between items-center">
              <span className="label-caps text-[#6f7881]">Total spent</span>
              <span className="font-mono text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">
                {formatCurrency(totalSpent)}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 bg-[#f3f4f5] dark:bg-[#1e2124] border-b border-[#e1e3e4] dark:border-[#3a3d40]">
              <span className="label-caps text-[#6f7881]">Category</span>
              <span />
              <span className="label-caps text-[#6f7881] text-right">Amount</span>
              <span className="label-caps text-[#6f7881] text-right">%</span>
            </div>

            {/* Table rows */}
            {breakdown.map(({ category, amount, percentage, count }, idx) => {
              const Icon = CATEGORY_ICONS[category as Category]
              const bgClass = CATEGORY_BG[category as Category]
              return (
                <div
                  key={category}
                  className={`
                    grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5
                    ${idx < breakdown.length - 1 ? 'border-b border-[#e1e3e4] dark:border-[#2e3132]' : ''}
                    hover:bg-[#f8f9fa] dark:hover:bg-[#1e2124] transition-colors
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#191c1d] dark:text-[#e2e4e5]">{category}</p>
                    <p className="text-[11px] text-[#6f7881]">{count} {count === 1 ? 'expense' : 'expenses'}</p>
                  </div>
                  <span className="font-mono text-[14px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums text-right">
                    {formatCurrency(amount)}
                  </span>
                  <span className="font-mono text-[12px] text-[#6f7881] tabular-nums text-right min-w-[36px]">
                    {percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
