'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentWeekRange, formatDateShort } from '@/lib/utils'
import type { Allowance } from '@/lib/types'

// ─── Week helpers ────────────────────────────────────────────────────────────

/** Parse a YYYY-MM-DD string to a local-noon Date (avoids DST shifts). */
function parseLocalDate(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

/** Format a Date to YYYY-MM-DD. */
function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/** Add `n` days to a YYYY-MM-DD string. */
function addDays(yyyymmdd: string, n: number): string {
  const d = parseLocalDate(yyyymmdd)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

interface Week {
  weekStart: string  // Monday YYYY-MM-DD
  weekEnd: string    // Sunday YYYY-MM-DD
}

/** Build a list of weeks centered on the current week, `radius` weeks either side. */
function buildWeekOptions(radius = 2): Week[] {
  const { weekStart: currentStart } = getCurrentWeekRange()
  const weeks: Week[] = []
  for (let offset = -radius; offset <= radius; offset++) {
    const start = addDays(currentStart, offset * 7)
    const end = addDays(start, 6)
    weeks.push({ weekStart: start, weekEnd: end })
  }
  return weeks
}

/** "Jul 6 – Jul 12" human label for a week. */
function weekLabel(week: Week): string {
  return `${formatDateShort(week.weekStart)} – ${formatDateShort(week.weekEnd)}`
}

// ─── Component ───────────────────────────────────────────────────────────────

interface AllowanceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (allowance: Allowance) => void
}

export function AllowanceModal({ open, onClose, onSuccess }: AllowanceModalProps) {
  const weeks = buildWeekOptions(2)
  const currentWeekStart = getCurrentWeekRange().weekStart

  // Index into `weeks` array; start on the current week
  const currentIndex = weeks.findIndex(w => w.weekStart === currentWeekStart)
  const [weekIndex, setWeekIndex] = useState(currentIndex >= 0 ? currentIndex : 2)

  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [prefilling, setPrefilling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedWeek = weeks[weekIndex]

  // ── Pre-fill if there's an existing allowance for the selected week ─────────
  // Requirement #5: pre-fill amount if week already has an allowance set.
  const fetchExisting = useCallback(async (weekStart: string) => {
    setPrefilling(true)
    try {
      const res = await fetch(`/api/allowance?week_start=${weekStart}`)
      if (res.ok) {
        const data: Allowance | null = await res.json()
        setAmount(data ? String(data.amount) : '')
      }
    } catch {
      // Non-fatal — just leave the field blank
    } finally {
      setPrefilling(false)
    }
  }, [])

  // Reset form whenever the modal opens or the selected week changes
  useEffect(() => {
    if (!open) return
    setError(null)
    fetchExisting(selectedWeek.weekStart)
  }, [open, selectedWeek.weekStart, fetchExisting])

  // Reset week index back to current week when modal is re-opened
  useEffect(() => {
    if (open) {
      setWeekIndex(currentIndex >= 0 ? currentIndex : 2)
    }
  }, [open, currentIndex])

  if (!open) return null

  // ── Save handler ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const raw = amount.trim()
    const parsed = parseFloat(raw)

    // Requirement #6: validate positive number
    if (!raw || isNaN(parsed) || parsed <= 0) {
      setError('Enter a positive amount greater than ₱0')
      return
    }

    setLoading(true)
    try {
      // Requirement #3: upsert — PUT /api/allowance with explicit week_start
      const res = await fetch('/api/allowance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, week_start: selectedWeek.weekStart }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Failed to save allowance')
        return
      }

      const saved: Allowance = await res.json()
      onSuccess(saved)        // Requirement #4: caller updates state immediately
      onClose()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) onClose()
  }

  const isCurrentWeek = selectedWeek.weekStart === currentWeekStart

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Dialog — matches ExpenseModal dimensions/style */}
      <div className="relative bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl w-full max-w-[440px] shadow-xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e1e3e4] dark:border-[#3a3d40]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#f3eafa] dark:bg-[#1e1230] flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-[#6a3a8c]" strokeWidth={1.5} />
            </div>
            <h2 className="text-[15px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
              Set weekly allowance
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] text-[#6f7881] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Week selector — Requirement #2 */}
          <div>
            <label className="block label-caps text-[#6f7881] mb-2">Week</label>
            <div className="flex items-center gap-2 bg-[#f3f4f5] dark:bg-[#1a1c1e] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl px-1 py-1">
              <button
                type="button"
                onClick={() => setWeekIndex(i => Math.max(0, i - 1))}
                disabled={weekIndex === 0}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#2e3132] text-[#6f7881] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>

              <div className="flex-1 text-center">
                <p className="text-[13px] font-medium text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">
                  Week of {weekLabel(selectedWeek)}
                </p>
                {isCurrentWeek && (
                  <p className="text-[10px] text-[#006492] dark:text-[#2D9CDB] font-medium mt-0.5">
                    Current week
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setWeekIndex(i => Math.min(weeks.length - 1, i + 1))}
                disabled={weekIndex === weeks.length - 1}
                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#2e3132] text-[#6f7881] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Amount input — Requirement #2 */}
          <div>
            <label
              htmlFor="allowance-modal-amount"
              className="block label-caps text-[#6f7881] mb-2"
            >
              Amount (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] font-mono font-medium text-[#6f7881] pointer-events-none select-none">
                ₱
              </span>
              {prefilling ? (
                <div className="w-full pl-8 pr-4 py-3 bg-[#f3f4f5] dark:bg-[#1a1c1e] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6f7881]" />
                </div>
              ) : (
                <input
                  id="allowance-modal-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(null) }}
                  placeholder="0.00"
                  className="
                    w-full pl-8 pr-4 py-3
                    font-mono text-[24px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]
                    bg-[#f3f4f5] dark:bg-[#1a1c1e]
                    border border-[#bec7d1] dark:border-[#3a3d40]
                    rounded-xl outline-none
                    focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15
                    transition-all placeholder-[#bec7d1]
                  "
                />
              )}
            </div>
          </div>

          {/* Inline error — Requirement #6 */}
          {error && (
            <div
              role="alert"
              className="text-[13px] text-[#ba1a1a] bg-[#ffdad6] dark:bg-[#5c1a1a] dark:text-[#ffb4ab] px-3 py-2 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 min-h-[44px] border border-[#bec7d1] dark:border-[#3a3d40] text-[14px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || prefilling}
              className="flex-1 py-2.5 min-h-[44px] bg-[#006492] hover:bg-[#004b6f] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save allowance
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
