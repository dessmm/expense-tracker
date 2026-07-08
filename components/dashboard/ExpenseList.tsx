'use client'

import { useState } from 'react'
import { formatCurrency, formatDate, groupByDate } from '@/lib/utils'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_BG } from '@/lib/utils'
import { Trash2, Pencil } from 'lucide-react'
import type { Expense, Category } from '@/lib/types'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'
import { DeleteConfirmModal } from '@/components/expenses/DeleteConfirmModal'

interface ExpenseListProps {
  expenses: Expense[]
  onUpdate: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, onUpdate, onDelete }: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)

  const grouped = groupByDate(expenses)
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a))

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-10 text-center">
        <p className="text-[15px] text-[#6f7881]">No expenses recorded this month.</p>
        <p className="text-[13px] text-[#bec7d1] mt-1">Click "Add expense" to get started.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl overflow-hidden">
        {sortedDates.map((date, dateIdx) => (
          <div key={date}>
            {/* Date header */}
            <div className={`px-5 py-2.5 bg-[#f3f4f5] dark:bg-[#1e2124] ${dateIdx > 0 ? 'border-t border-[#e1e3e4] dark:border-[#3a3d40]' : ''}`}>
              <span className="label-caps text-[#6f7881]">{formatDate(date)}</span>
            </div>

            {/* Expense rows */}
            {grouped.get(date)!.map((expense, idx) => {
              const Icon = CATEGORY_ICONS[expense.category as Category]
              const categoryClass = CATEGORY_BG[expense.category as Category]

              return (
                <div
                  key={expense.id}
                  className={`
                    flex items-center gap-4 px-5 py-3.5 group
                    hover:bg-[#f8f9fa] dark:hover:bg-[#1e2124] transition-colors
                    ${idx < grouped.get(date)!.length - 1 ? 'border-b border-[#e1e3e4] dark:border-[#2e3132]' : ''}
                  `}
                >
                  {/* Category badge */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryClass}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-[#191c1d] dark:text-[#e2e4e5] truncate">
                      {expense.note || expense.category}
                    </p>
                    <p className="text-[12px] text-[#6f7881] mt-0.5">
                      {expense.category}
                      {expense.note && expense.note !== expense.category ? ` · ${expense.note}` : ''}
                    </p>
                    {expense.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(expense.tags)
                          ? (expense.tags as string[])
                          : ((expense.tags as any).split(',') as string[]).map((t: string) => t.trim()).filter(Boolean)
                        ).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-[#e8f4fb] dark:bg-[#1a3040] text-[#006492] dark:text-[#2D9CDB] rounded border border-[#bec7d1]/30 dark:border-[#3a3d40]/30 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">
                      {formatCurrency(expense.amount)}
                    </span>

                    {/* Actions (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="p-1.5 rounded-md hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] text-[#6f7881] hover:text-[#006492] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setDeletingExpense(expense)}
                        className="p-1.5 rounded-md hover:bg-[#ffdad6] text-[#6f7881] hover:text-[#ba1a1a] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingExpense && (
        <ExpenseModal
          open={true}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={(updated) => {
            onUpdate(updated)
            setEditingExpense(null)
          }}
        />
      )}

      {/* Delete confirm modal */}
      {deletingExpense && (
        <DeleteConfirmModal
          expense={deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onConfirm={() => {
            onDelete(deletingExpense.id)
            setDeletingExpense(null)
          }}
        />
      )}
    </>
  )
}
