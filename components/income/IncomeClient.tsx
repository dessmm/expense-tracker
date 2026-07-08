'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, groupByDate, navigateMonth } from '@/lib/utils'
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Pencil, 
  AlertCircle,
  Coins,
  TrendingUp
} from 'lucide-react'
import type { Income } from '@/lib/types'
import { IncomeModal } from './IncomeModal'

interface IncomeClientProps {
  initialIncomes: Income[]
  currentMonth: string
  error?: string | null
}

export function IncomeClient({ initialIncomes, currentMonth, error: initialError }: IncomeClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [incomes, setIncomes] = useState<Income[]>(initialIncomes)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)

  const monthName = new Date(currentMonth + '-02').toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  })

  // Calculate totals
  const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0)

  // Grouped list
  const grouped = groupByDate(incomes)
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))

  function handleMonthChange(direction: 'prev' | 'next') {
    const nextMonth = navigateMonth(currentMonth, direction)
    startTransition(() => {
      router.push(`/income?month=${nextMonth}`)
    })
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return
    
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/income?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to delete income')

      setIncomes(prev => prev.filter(inc => inc.id !== id))
    } catch (err: any) {
      setError(err.message || 'Error deleting income')
    } finally {
      setLoading(false)
    }
  }

  function handleSuccess(newOrUpdated: Income) {
    // If it's in the current month, update local list
    const entryMonth = newOrUpdated.date.slice(0, 7)
    if (entryMonth === currentMonth) {
      setIncomes(prev => {
        const exists = prev.some(inc => inc.id === newOrUpdated.id)
        if (exists) {
          return prev.map(inc => inc.id === newOrUpdated.id ? newOrUpdated : inc)
        } else {
          return [newOrUpdated, ...prev].sort((a, b) => b.date.localeCompare(a.date))
        }
      })
    } else {
      // Navigate to the added entry's month
      router.push(`/income?month=${entryMonth}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#191c1d] dark:text-[#e2e4e5]">
            Income Tracker
          </h1>
          <p className="text-[14px] text-[#5c6063] dark:text-[#9aacb5]">
            Track sources of income and net worth updates
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#006492] hover:bg-[#004b6f] text-white text-[14px] font-medium rounded-lg transition-colors cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" />
          Add income
        </button>
      </div>

      {error && (
        <div className="bg-[#ffdad6] border border-[#ffb4ab] rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#ba1a1a] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[14px] font-medium text-[#ba1a1a]">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="text-[13px] font-bold text-[#ba1a1a] underline mt-1 block hover:opacity-80"
            >
              Retry loading data
            </button>
          </div>
        </div>
      )}

      {/* Month Selector & Total Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Month Selector */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex items-center justify-between">
          <button
            onClick={() => handleMonthChange('prev')}
            className="p-2 rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] text-[#6f7881] transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[16px] font-bold text-[#191c1d] dark:text-[#e2e4e5]">
            {monthName}
          </span>
          <button
            onClick={() => handleMonthChange('next')}
            className="p-2 rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] text-[#6f7881] transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e3f2fd] dark:bg-[#1a3a5f] flex items-center justify-center flex-shrink-0 text-[#0d47a1] dark:text-[#90caf9]">
            <Coins className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] text-[#6f7881] label-caps">Total Income</p>
            <p className="text-[22px] font-bold font-mono text-[#191c1d] dark:text-[#e2e4e5] mt-0.5 tabular-nums">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e8f5e9] dark:bg-[#1b4332] flex items-center justify-center flex-shrink-0 text-[#2e7d32] dark:text-[#81c784]">
            <TrendingUp className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] text-[#6f7881] label-caps">Income Entries</p>
            <p className="text-[22px] font-bold font-mono text-[#191c1d] dark:text-[#e2e4e5] mt-0.5">
              {incomes.length}
            </p>
          </div>
        </div>
      </div>

      {/* Income List */}
      <div>
        <h2 className="text-[16px] font-bold text-[#191c1d] dark:text-[#e2e4e5] mb-4">
          Income History
        </h2>

        {incomes.length === 0 ? (
          <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-10 text-center">
            <p className="text-[15px] text-[#6f7881]">No income recorded this month.</p>
            <p className="text-[13px] text-[#bec7d1] mt-1">Click "Add income" to log your first entry.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl overflow-hidden">
            {sortedDates.map((date, dateIdx) => (
              <div key={date}>
                {/* Date header */}
                <div className={`px-5 py-2.5 bg-[#f3f4f5] dark:bg-[#1e2124] ${dateIdx > 0 ? 'border-t border-[#e1e3e4] dark:border-[#3a3d40]' : ''}`}>
                  <span className="label-caps text-[#6f7881]">{formatDate(date)}</span>
                </div>

                {/* Rows */}
                {grouped.get(date)!.map((inc, idx) => (
                  <div
                    key={inc.id}
                    className={`
                      flex items-center gap-4 px-5 py-3.5 group
                      hover:bg-[#f8f9fa] dark:hover:bg-[#1e2124] transition-colors
                      ${idx < grouped.get(date)!.length - 1 ? 'border-b border-[#e1e3e4] dark:border-[#2e3132]' : ''}
                    `}
                  >
                    {/* Source Indicator */}
                    <div className="w-9 h-9 rounded-lg bg-[#e8f5e9] dark:bg-[#1b4332] text-[#2e7d32] dark:text-[#81c784] flex items-center justify-center flex-shrink-0">
                      <Coins className="w-4 h-4" strokeWidth={1.5} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#191c1d] dark:text-[#e2e4e5] truncate">
                        {inc.source}
                      </p>
                      {inc.note && (
                        <p className="text-[12px] text-[#6f7881] mt-0.5 truncate">
                          {inc.note}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[15px] font-semibold text-[#2e7d32] dark:text-[#81c784] tabular-nums">
                        +{formatCurrency(inc.amount)}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        <button
                          onClick={() => setEditingIncome(inc)}
                          className="p-1.5 rounded-md hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] text-[#6f7881] hover:text-[#006492] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inc.id)}
                          className="p-1.5 rounded-md hover:bg-[#ffdad6] dark:hover:bg-[#2d1b1a] text-[#6f7881] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                          title="Delete"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <IncomeModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Edit Modal */}
      <IncomeModal
        open={!!editingIncome}
        income={editingIncome || undefined}
        onClose={() => setEditingIncome(null)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
