'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, X, Loader2, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  detectRecurringPatterns,
  loadDismissedPatterns,
  savePatternDismissal,
  type RecurringPattern
} from '@/lib/recurring-detection'
import { CATEGORY_COLORS } from '@/lib/utils'
import type { Expense, ExpenseTemplate, Category } from '@/lib/types'

interface RecurringSuggestionsProps {
  expenses: Expense[]
  templates: ExpenseTemplate[]
  /** Called after a template is saved so the parent can update its list */
  onTemplateSaved: (template: ExpenseTemplate) => void
}

interface SuggestionState {
  saving: boolean
  saved: boolean
  error: string | null
}

export function RecurringSuggestions({
  expenses,
  templates,
  onTemplateSaved,
}: RecurringSuggestionsProps) {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([])
  const [states, setStates] = useState<Record<string, SuggestionState>>({})
  const [mounted, setMounted] = useState(false)

  // Only run on client (needs localStorage + last-30-day window)
  useEffect(() => {
    setMounted(true)
    const dismissed = loadDismissedPatterns()

    // Limit to last 30 days of expenses
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    const recent = expenses.filter(e => e.date >= cutoffStr)

    const detected = detectRecurringPatterns(recent, templates, dismissed)
    setPatterns(detected)

    // Initialise per-pattern state
    const initial: Record<string, SuggestionState> = {}
    detected.forEach(p => {
      initial[p.dismissKey] = { saving: false, saved: false, error: null }
    })
    setStates(initial)
  }, [expenses, templates])

  const dismiss = useCallback((dismissKey: string) => {
    savePatternDismissal(dismissKey)
    setPatterns(prev => prev.filter(p => p.dismissKey !== dismissKey))
  }, [])

  const saveTemplate = useCallback(async (pattern: RecurringPattern) => {
    setStates(prev => ({
      ...prev,
      [pattern.dismissKey]: { saving: true, saved: false, error: null }
    }))

    try {
      const res = await fetch('/api/expense_templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: pattern.note,
          amount: pattern.medianAmount,
          category: pattern.category,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save template')

      setStates(prev => ({
        ...prev,
        [pattern.dismissKey]: { saving: false, saved: true, error: null }
      }))

      onTemplateSaved(data as ExpenseTemplate)

      // Auto-dismiss the card after 1.5 s
      setTimeout(() => {
        setPatterns(prev => prev.filter(p => p.dismissKey !== pattern.dismissKey))
      }, 1500)
    } catch (err: any) {
      setStates(prev => ({
        ...prev,
        [pattern.dismissKey]: { saving: false, saved: false, error: err.message }
      }))
    }
  }, [onTemplateSaved])

  if (!mounted || patterns.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      {patterns.map(pattern => {
        const state = states[pattern.dismissKey] ?? { saving: false, saved: false, error: null }
        const dotColor = CATEGORY_COLORS[pattern.category as Category] || '#2D9CDB'

        return (
          <div
            key={pattern.dismissKey}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 bg-[#fffbeb] dark:bg-[#251d0a] border border-[#fde68a] dark:border-[#4a3810] rounded-xl text-[13px]"
          >
            {/* Icon + message */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fef3c7] dark:bg-[#3d2e0e] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#ca850c] dark:text-[#fbbf24]" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[#78350f] dark:text-[#fef3c7] leading-snug">
                  You've logged{' '}
                  <span className="font-semibold">
                    "{pattern.note}"
                  </span>{' '}
                  <span className="font-medium">{pattern.count} times</span> in the last 30 days
                  {' '}—{' '}
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: dotColor }} />
                    <span className="text-[12px] text-[#92400e] dark:text-[#fde68a]">{pattern.category}</span>
                  </span>
                  {', '}avg{' '}
                  <span className="font-mono font-semibold">{formatCurrency(pattern.medianAmount)}</span>
                </p>
                {state.error && (
                  <p className="text-[11px] text-[#ba1a1a] mt-0.5">{state.error}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
              {state.saved ? (
                <span className="flex items-center gap-1.5 text-[12px] text-[#2e7d32] dark:text-[#81c784] font-medium px-3 py-1.5 bg-[#e8f5e9] dark:bg-[#1b4332] rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Saved!
                </span>
              ) : (
                <button
                  onClick={() => saveTemplate(pattern)}
                  disabled={state.saving}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#ca850c] hover:bg-[#a16207] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 cursor-pointer select-none"
                >
                  {state.saving
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                  }
                  Save template
                </button>
              )}

              <button
                onClick={() => dismiss(pattern.dismissKey)}
                disabled={state.saving || state.saved}
                className="p-1.5 rounded-lg text-[#92400e] dark:text-[#fde68a] hover:bg-[#fde68a]/30 dark:hover:bg-[#4a3810] transition-colors disabled:opacity-40 cursor-pointer"
                title="Don't show this suggestion again"
                aria-label="Dismiss suggestion"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
