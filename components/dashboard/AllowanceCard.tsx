'use client'

import { useState, useRef, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import {
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  PiggyBank,
  Trash2,
} from 'lucide-react'
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal'
import type { Allowance } from '@/lib/types'

interface AllowanceCardProps {
  allowance: Allowance | null
  spentThisWeek: number
  billSavingsTarget: number
  onAllowanceSaved: (allowance: Allowance) => void
  onAllowanceDeleted: () => void
}

export function AllowanceCard({
  allowance,
  spentThisWeek,
  billSavingsTarget,
  onAllowanceSaved,
  onAllowanceDeleted,
}: AllowanceCardProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing || !allowance) {
      inputRef.current?.focus()
      if (editing) inputRef.current?.select()
    }
  }, [editing, allowance])

  function startEditing() {
    setInputValue(allowance ? String(allowance.amount) : '')
    setError(null)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError(null)
    setInputValue('')
  }

  async function handleSave() {
    const raw = inputValue.trim()
    const amount = parseFloat(raw)
    if (!raw || isNaN(amount) || amount <= 0) {
      setError('Enter a positive amount greater than ₱0')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/allowance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Failed to save allowance')
        return
      }
      const saved = await res.json()
      onAllowanceSaved(saved)
      setEditing(false)
      setInputValue('')
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') await handleSave()
    if (e.key === 'Escape') {
      if (allowance) cancelEditing()
      else setError(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!allowance) return
    const res = await fetch('/api/allowance', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week_start: allowance.week_start }),
    })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to delete allowance')
    }
    setDeleteModalOpen(false)
    onAllowanceDeleted()
  }

  const hasAllowance = allowance !== null
  const weeklyAllowance = allowance?.amount ?? 0
  const availableToSpend = weeklyAllowance - billSavingsTarget - spentThisWeek
  const isOverAvailable = availableToSpend < 0
  const committedTotal = spentThisWeek + billSavingsTarget
  const committedPercent = weeklyAllowance > 0
    ? Math.min(100, Math.round((committedTotal / weeklyAllowance) * 100))
    : 0
  const spentPercent = weeklyAllowance > 0
    ? (spentThisWeek / weeklyAllowance) * 100
    : 0

  const inputBlock = (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[14px] text-[#6f7881] pointer-events-none select-none">₱</span>
        <input
          ref={inputRef}
          id="allowance-input"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(null) }}
          onKeyDown={handleKeyDown}
          placeholder="Set your allowance for this week"
          className="w-full pl-7 pr-3 py-1.5 font-mono text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] bg-[#f3f4f5] dark:bg-[#1a1c1e] border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg outline-none focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15 transition-all placeholder-[#bec7d1] tabular-nums"
          disabled={saving}
        />
      </div>
      {error && <p id="allowance-error" role="alert" className="text-[11px] text-[#ba1a1a] -mt-1">{error}</p>}
      <div className="flex gap-2">
        {hasAllowance && (
          <button id="allowance-cancel-btn" onClick={cancelEditing} className="flex-1 py-1.5 border border-[#bec7d1] dark:border-[#3a3d40] text-[12px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors flex items-center justify-center gap-1">
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            Cancel
          </button>
        )}
        <button id="allowance-save-btn" onClick={handleSave} disabled={saving} className="flex-1 py-1.5 bg-[#006492] hover:bg-[#004b6f] text-white text-[12px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-60">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
          Save
        </button>
      </div>
    </div>
  )

  if (!hasAllowance) {
    return (
      <div className="bg-white dark:bg-[#232629] border border-[#2D9CDB]/40 ring-1 ring-[#2D9CDB]/10 rounded-xl p-5 flex flex-col justify-between min-h-[160px]" aria-label="Set weekly allowance">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#f3eafa] dark:bg-[#1e1230] flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-[#6a3a8c]" strokeWidth={1.5} />
            </div>
            <span className="label-caps text-[#6f7881]">Weekly allowance</span>
          </div>
          <p className="text-[11px] text-[#6f7881] mb-3">No allowance set for this week.</p>
        </div>
        {inputBlock}
      </div>
    )
  }

  if (editing) {
    return (
      <div className="bg-white dark:bg-[#232629] border border-[#2D9CDB] ring-2 ring-[#2D9CDB]/10 rounded-xl p-5 flex flex-col justify-between min-h-[160px]" aria-label="Edit weekly allowance">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#f3eafa] dark:bg-[#1e1230] flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-[#6a3a8c]" strokeWidth={1.5} />
            </div>
            <span className="label-caps text-[#6f7881]">Edit allowance</span>
          </div>
          {inputBlock}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 flex flex-col justify-between min-h-[160px]" aria-label="Weekly allowance">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f3eafa] dark:bg-[#1e1230] flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-[#6a3a8c]" strokeWidth={1.5} />
              </div>
              <span className="label-caps text-[#6f7881]">Weekly allowance</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button id="allowance-edit-btn" onClick={startEditing} title="Edit allowance" className="p-1.5 rounded-md text-[#6f7881] hover:text-[#006492] hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] transition-colors">
                <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
              <button id="allowance-delete-btn" onClick={() => setDeleteModalOpen(true)} title="Delete allowance" className="p-1.5 rounded-md text-[#6f7881] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors">
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px] text-[#6f7881]">
              <span>Weekly allowance</span>
              <span className="font-mono text-[#191c1d] dark:text-[#e2e4e5] font-medium">{formatCurrency(weeklyAllowance)}</span>
            </div>
            <div className="flex items-center justify-between text-[12px] text-[#6f7881]">
              <span>Spent this week</span>
              <span className="font-mono text-[#191c1d] dark:text-[#e2e4e5] font-medium">{formatCurrency(spentThisWeek)}</span>
            </div>
            {billSavingsTarget > 0 && (
              <div className="flex items-center justify-between text-[12px] text-[#ca850c]">
                <span>Bill savings needed</span>
                <span className="font-mono font-medium">{formatCurrency(billSavingsTarget)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-3.5">
          {spentPercent > 80 && (
            <div className="mb-2.5 text-[11px] font-semibold text-[#ca850c] dark:text-[#fbbf24] bg-[#fffbeb] dark:bg-[#2a1f10] border border-[#fef3c7] dark:border-[#4f3a1d] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 select-none leading-none">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ca850c] dark:text-[#fbbf24]" strokeWidth={2} />
              <span>Warning: Exceeded 80% of allowance!</span>
            </div>
          )}
          <div className="h-1.5 bg-[#edeeef] dark:bg-[#2e3132] rounded-full overflow-hidden mb-2.5">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${committedPercent}%`, backgroundColor: isOverAvailable ? '#ca850c' : committedPercent > 80 ? '#f59e0b' : '#2D9CDB' }} />
          </div>
          <div className="border-t border-[#e1e3e4] dark:border-[#2e3132] pt-2.5">
            <div className="flex items-center justify-between">
              {isOverAvailable ? (
                <>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#ca850c]" strokeWidth={1.5} />
                    <span className="text-[12px] font-medium text-[#ca850c]">Over budget</span>
                  </div>
                  <span className="font-mono text-[14px] font-semibold text-[#ca850c] tabular-nums">{formatCurrency(Math.abs(availableToSpend))}</span>
                </>
              ) : (
                <>
                  <span className="text-[12px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">Available to spend</span>
                  <span className="font-mono text-[14px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">{formatCurrency(availableToSpend)}</span>
                </>
              )}
            </div>
            {weeklyAllowance > 0 && (
              <p className="text-[10px] text-[#6f7881] font-mono mt-0.5 text-right">{committedPercent}% committed</p>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        open={deleteModalOpen}
        title="Delete allowance?"
        description={`Remove the ₱${weeklyAllowance.toFixed(2)} allowance for this week?`}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
