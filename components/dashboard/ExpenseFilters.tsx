'use client'

import { CATEGORIES } from '@/lib/types'
import { X, Search, Download } from 'lucide-react'
import { exportToCSV } from '@/lib/utils'
import type { Expense } from '@/lib/types'

/** Filter state shape */
export interface ExpenseFilterState {
  category: string
  dateFrom: string
  dateTo: string
  search: string
}

interface ExpenseFiltersProps {
  /** All expenses in the current month (used for counts if needed) */
  expenses: Expense[]
  filters: ExpenseFilterState
  onFilterChange: (filters: ExpenseFilterState) => void
}

/**
 * Compact horizontal filter bar for the expense list.
 * Includes category dropdown, text search, date range, and clear button.
 */
export function ExpenseFilters({ expenses, filters, onFilterChange }: ExpenseFiltersProps) {
  const hasActiveFilters = !!(filters.category || filters.dateFrom || filters.dateTo || filters.search)

  function update(partial: Partial<ExpenseFilterState>) {
    onFilterChange({ ...filters, ...partial })
  }

  function clearAll() {
    onFilterChange({ category: '', dateFrom: '', dateTo: '', search: '' })
  }

  const inputClass = `
    bg-[#f3f4f5] dark:bg-[#1a1c1e]
    border border-[#bec7d1] dark:border-[#3a3d40]
    rounded-lg text-[13px] text-[#191c1d] dark:text-[#e2e4e5]
    outline-none focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15
    transition-all placeholder-[#bec7d1] dark:placeholder-[#3a3d40]
  `

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {/* Category select */}
      <select
        value={filters.category}
        onChange={e => update({ category: e.target.value })}
        className={`${inputClass} px-3 py-1.5 pr-7 appearance-none cursor-pointer`}
        aria-label="Filter by category"
        style={{ backgroundImage: 'none' }}
      >
        <option value="">All categories</option>
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* Search by note */}
      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6f7881] pointer-events-none" strokeWidth={1.5} />
        <input
          type="text"
          value={filters.search}
          onChange={e => update({ search: e.target.value })}
          placeholder="Search note or tag…"
          className={`${inputClass} w-full pl-8 pr-3 py-1.5`}
          aria-label="Search expenses by note or tag"
        />
      </div>

      {/* Date from */}
      <input
        type="date"
        value={filters.dateFrom}
        onChange={e => update({ dateFrom: e.target.value })}
        className={`${inputClass} px-3 py-1.5`}
        aria-label="Filter from date"
      />

      {/* Date to */}
      <input
        type="date"
        value={filters.dateTo}
        onChange={e => update({ dateTo: e.target.value })}
        className={`${inputClass} px-3 py-1.5`}
        aria-label="Filter to date"
      />

      {/* Clear button (only when active) */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#ba1a1a] bg-[#ffdad6] hover:bg-[#ffb4ab] rounded-lg transition-colors"
          aria-label="Clear all filters"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          Clear
        </button>
      )}

      {/* Export CSV button */}
      <button
        onClick={() => {
          const filtered = expenses.filter(e => {
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
          const monthStr = expenses[0]?.date.slice(0, 7) || 'current'
          exportToCSV(filtered, `expenses-${monthStr}.csv`)
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#3f4850] dark:text-[#9aacb5] bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] rounded-lg transition-colors ml-auto"
        aria-label="Export filtered expenses as CSV"
      >
        <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
        Export CSV
      </button>
    </div>
  )
}
