'use client'

import { useState, useMemo } from 'react'
import { formatCurrency, getBillDueDate, getWeeksRemaining, getCurrentMonth, formatMonthLabel, getTodayPHTDate } from '@/lib/utils'
import { Plus, Trash2, CalendarDays, Coins, Check, X, Loader2, ArrowRight, Pencil, Receipt, AlertCircle, AlertTriangle } from 'lucide-react'
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal'
import type { RecurringBill, BillSavingsProgress } from '@/lib/types'

interface BillsClientProps {
  initialBills: RecurringBill[]
  initialProgress: BillSavingsProgress[]
  initialMonth: string
  error?: string
}

export function BillsClient({ initialMonth, initialBills, initialProgress, error }: BillsClientProps) {
  const [bills, setBills] = useState<RecurringBill[]>(initialBills)
  const [progressList, setProgressList] = useState<BillSavingsProgress[]>(initialProgress)
  const [month, setMonth] = useState(initialMonth)

  // ── Form State for Add Bill ────────────────────────────
  const [newBillName, setNewBillName] = useState('')
  const [newBillAmount, setNewBillAmount] = useState('')
  const [newBillStartDate, setNewBillStartDate] = useState('')
  const [addingBill, setAddingBill] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Initialize start date on mount safely
  useState(() => {
    if (typeof window !== 'undefined') {
      setNewBillStartDate(getTodayPHTDate())
    }
  })

  // ── Logging Progress State ─────────────────────────────
  const [loggingBillId, setLoggingBillId] = useState<string | null>(null)
  const [logAmount, setLogAmount] = useState('')
  const [loggingProgress, setLoggingProgress] = useState(false)

  // ── Delete State ───────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<RecurringBill | null>(null)
  const [undoToast, setUndoToast] = useState<{
    visible: boolean
    message: string
    data: RecurringBill
    savedProgress: BillSavingsProgress[]
  } | null>(null)

  // ── Edit State ─────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<RecurringBill | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // ── Fetch all data on month change ─────────────────────
  async function refreshData(targetMonth: string) {
    const res = await fetch(`/api/bills?month=${targetMonth}`)
    if (res.ok) {
      const data = await res.json()
      setBills(data.bills)
      setProgressList(data.progress)
    }
  }

  // ── Add recurring bill handler ────────────────────────
  async function handleAddBill(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)

    const amount = parseFloat(newBillAmount)

    if (!newBillName.trim()) {
      setAddError('Please enter a name')
      return
    }
    if (isNaN(amount) || amount <= 0) {
      setAddError('Please enter an amount greater than 0')
      return
    }
    if (!newBillStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(newBillStartDate)) {
      setAddError('Please select a valid start date')
      return
    }

    setAddingBill(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBillName, amount, start_date: newBillStartDate }),
      })

      if (!res.ok) {
        const body = await res.json()
        setAddError(body.error ?? 'Failed to add bill')
        return
      }

      const added = await res.json()
      setBills(prev => [...prev, added])
      // Reset form
      setNewBillName('')
      setNewBillAmount('')
      setNewBillStartDate(getTodayPHTDate())
    } catch {
      setAddError('Network error')
    } finally {
      setAddingBill(false)
    }
  }

  // ── Delete recurring bill handler ─────────────────────
  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    const res = await fetch(`/api/bills?id=${deleteTarget.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json()
      throw new Error(body.error ?? 'Failed to delete bill')
    }

    const savedProgress = progressList.filter(p => p.bill_id === deleteTarget.id)

    setUndoToast({
      visible: true,
      message: `Bill "${deleteTarget.name}" deleted.`,
      data: deleteTarget,
      savedProgress
    })

    const removedId = deleteTarget.id
    setTimeout(() => {
      setUndoToast(prev => prev?.data.id === removedId ? null : prev)
    }, 5000)

    setBills(prev => prev.filter(b => b.id !== deleteTarget.id))
    setProgressList(prev => prev.filter(p => p.bill_id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  async function handleUndoBill() {
    if (!undoToast) return
    const bill = undoToast.data
    const progressListToRestore = undoToast.savedProgress

    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bill.name,
          amount: bill.amount,
          start_date: bill.start_date
        })
      })

      if (res.ok) {
        const restoredBill = await res.json()
        setBills(prev => [...prev, restoredBill])

        // Restore savings progress if there was any
        for (const prog of progressListToRestore) {
          const putRes = await fetch('/api/bills', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bill_id: restoredBill.id,
              amount_saved: prog.amount_saved,
              month: prog.month
            })
          })
          if (putRes.ok) {
            const restoredProg = await putRes.json()
            setProgressList(prev => [...prev, restoredProg])
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setUndoToast(null)
    }
  }

  // ── Start editing ─────────────────────────────────────
  function startEdit(bill: RecurringBill) {
    setEditTarget(bill)
    setEditName(bill.name)
    setEditAmount(String(bill.amount))
    setEditStartDate(bill.start_date)
    setEditError(null)
  }

  // ── Save edit ─────────────────────────────────────────
  async function handleSaveEdit() {
    if (!editTarget) return
    setEditError(null)

    const amount = parseFloat(editAmount)

    if (!editName.trim()) {
      setEditError('Please enter a name')
      return
    }
    if (isNaN(amount) || amount <= 0) {
      setEditError('Please enter an amount greater than 0')
      return
    }
    if (!editStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(editStartDate)) {
      setEditError('Please select a valid start date')
      return
    }

    setEditSaving(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget.id, name: editName.trim(), amount, start_date: editStartDate }),
      })

      if (!res.ok) {
        const body = await res.json()
        setEditError(body.error ?? 'Failed to update bill')
        return
      }

      const updated = await res.json()
      setBills(prev => prev.map(b => b.id === updated.id ? updated : b))
      setEditTarget(null)
    } catch {
      setEditError('Network error')
    } finally {
      setEditSaving(false)
    }
  }

  // ── Log savings progress handler ──────────────────────
  async function handleLogSavings(billId: string, currentSaved: number) {
    const amount = parseFloat(logAmount)
    if (isNaN(amount) || amount < 0) {
      return
    }

    setLoggingProgress(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bill_id: billId, amount_saved: amount, month }),
      })

      if (res.ok) {
        const updatedProgress = await res.json()
        setProgressList(prev => {
          const exists = prev.some(p => p.bill_id === billId)
          if (exists) {
            return prev.map(p => p.bill_id === billId ? updatedProgress : p)
          }
          return [...prev, updatedProgress]
        })
        setLoggingBillId(null)
        setLogAmount('')
      }
    } catch {
      // silently ignore network errors
    } finally {
      setLoggingProgress(false)
    }
  }

  const upcomingBills = useMemo(() => {
    const todayStr = getTodayPHTDate()
    const [y, m, d] = todayStr.split('-').map(Number)
    const today = new Date(y, m - 1, d, 12, 0, 0)

    return bills
      .map(bill => {
        const dueDateObj = getBillDueDate(bill.start_date)
        const daysDiff = Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        const progress = progressList.find(p => p.bill_id === bill.id)
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
          formattedDueDate: `Due ${formattedDueDate}`,
        }
      })
      .sort((a, b) => {
        if (a.state === 'overdue' && b.state !== 'overdue') return -1
        if (a.state !== 'overdue' && b.state === 'overdue') return 1
        return a.dueDateObj.getTime() - b.dueDateObj.getTime()
      })
  }, [bills, progressList])

  function formatRelativeTime(days: number): string {
    if (days < 0) {
      const absDays = Math.abs(days)
      if (absDays === 1) return '1 day overdue'
      return `${absDays} days overdue`
    }
    if (days === 0) return 'due today'
    if (days === 1) return 'due tomorrow'
    if (days < 14) return `in ${days} days`

    const weeks = Math.round(days / 7)
    if (weeks < 8) {
      return `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    }

    const months = Math.round(days / 30)
    return `in ${months} ${months === 1 ? 'month' : 'months'}`
  }

  const inputClass = `
    w-full px-3 py-2 text-[13px]
    bg-[#f3f4f5] dark:bg-[#1a1c1e]
    border border-[#bec7d1] dark:border-[#3a3d40]
    rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
    outline-none focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15
    transition-all placeholder-[#bec7d1]
  `

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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
          Bills &amp; Savings
        </h1>
        <p className="text-[13px] text-[#6f7881] mt-0.5">
          Plan, set aside, and track progress for your recurring monthly payments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ── Bill Savings List ─────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-[13px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] mb-2 uppercase tracking-wider">
            Upcoming Bills
          </h2>

          {bills.length === 0 ? (
            <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#e8f4fb] dark:bg-[#1a3040] flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-7 h-7 text-[#2D9CDB]" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] mb-1">No bills added yet</p>
              <p className="text-[13px] text-[#6f7881]">Add your subscriptions, internet bills, or rent using the panel on the right.</p>
            </div>
          ) : (
            upcomingBills.map(({
              bill,
              dueDateObj,
              daysDiff,
              state,
              saved,
              remainingToSave,
              weeksRemaining,
              weeklyTarget,
              savedPercentage,
              formattedDueDate
            }) => {
              const isEditing = editTarget?.id === bill.id
              const isOverdue = state === 'overdue'
              const isDueSoon = state === 'due_soon'

              let cardBorderStyle = 'border-[#bec7d1] dark:border-[#3a3d40]'
              let relativeColor = 'text-[#6f7881]'

              if (isOverdue) {
                cardBorderStyle = 'border-[#bec7d1] dark:border-[#3a3d40] border-l-4 border-l-[#ba1a1a] dark:border-l-[#ffb4ab]'
                relativeColor = 'text-[#ba1a1a] dark:text-[#ffb4ab] font-semibold'
              } else if (isDueSoon) {
                cardBorderStyle = 'border-[#bec7d1] dark:border-[#3a3d40] border-l-4 border-l-[#ca850c] dark:border-l-[#fbbf24]'
                relativeColor = 'text-[#ca850c] dark:text-[#fbbf24] font-semibold'
              }

              return (
                <div
                  key={bill.id}
                  className={`bg-white dark:bg-[#232629] border rounded-xl p-5 space-y-4 shadow-sm transition-all ${cardBorderStyle}`}
                >
                  {isEditing ? (
                    /* ── Inline edit form ── */
                    <div className="space-y-3">
                      <h3 className="text-[13px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] uppercase tracking-wider">
                        Edit Bill
                      </h3>
                      <div>
                        <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Bill Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className={inputClass}
                          placeholder="e.g. Netflix, Wifi Bill"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Monthly Amount</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-[#6f7881]">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                            className={`${inputClass} pl-7 font-mono tabular-nums`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={e => setEditStartDate(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      {editError && (
                        <p className="text-[11px] text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg">{editError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditTarget(null); setEditError(null) }}
                          className="flex-1 py-2 border border-[#bec7d1] dark:border-[#3a3d40] text-[12px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={editSaving}
                          className="flex-1 py-2 bg-[#006492] hover:bg-[#004b6f] text-white text-[12px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1 disabled:opacity-60"
                        >
                          {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Bill Row Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-[16px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
                            {bill.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6f7881]">
                            <CalendarDays className="w-3.5 h-3.5 text-[#6f7881]" strokeWidth={1.5} />
                            <span>{formattedDueDate}</span>
                            <span>·</span>
                            <div className="flex items-center gap-1">
                              {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-[#ba1a1a] dark:text-[#ffb4ab]" />}
                              {isDueSoon && <AlertTriangle className="w-3.5 h-3.5 text-[#ca850c] dark:text-[#fbbf24]" />}
                              <span className={relativeColor}>{formatRelativeTime(daysDiff)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono text-[16px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">
                              {formatCurrency(bill.amount)}
                            </span>
                            <span className="block text-[10px] text-[#6f7881]">monthly</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(bill)}
                              className="p-1.5 rounded-lg text-[#bec7d1] hover:text-[#006492] hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] transition-colors"
                              title="Edit bill"
                            >
                              <Pencil className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(bill)}
                              className="p-1.5 rounded-lg text-[#bec7d1] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                              title="Delete bill"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[#6f7881]">Saved: {formatCurrency(saved)}</span>
                          <span className="font-medium text-[#191c1d] dark:text-[#e2e4e5]">{savedPercentage}%</span>
                        </div>

                        <div className="h-2 bg-[#edeeef] dark:bg-[#2e3132] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#27ae60] rounded-full transition-all duration-300"
                            style={{ width: `${savedPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Savings Targets / Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#e1e3e4] dark:border-[#2e3132] pt-4 mt-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#6f7881] font-semibold">Weekly Target</p>
                          <p className="font-mono text-[15px] font-bold text-[#006492] dark:text-[#2D9CDB] mt-0.5 tabular-nums">
                            {remainingToSave === 0 ? '₱0.00' : formatCurrency(weeklyTarget)}
                          </p>
                        </div>

                        {loggingBillId === bill.id ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-[#6f7881]">₱</span>
                              <input
                                type="number"
                                placeholder="0"
                                value={logAmount}
                                onChange={(e) => setLogAmount(e.target.value)}
                                className="
                                  w-[100px] pl-6 pr-2 py-1.5
                                  font-mono text-[13px] text-[#191c1d] dark:text-[#e2e4e5]
                                  bg-[#f3f4f5] dark:bg-[#1a1c1e]
                                  border border-[#bec7d1] dark:border-[#3a3d40]
                                  rounded-lg outline-none focus:border-[#2D9CDB]
                                "
                              />
                            </div>
                            <button
                              onClick={() => handleLogSavings(bill.id, saved)}
                              disabled={loggingProgress}
                              className="p-2 bg-[#27ae60] hover:bg-[#1e7e44] text-white rounded-lg transition-colors disabled:opacity-60"
                            >
                              {loggingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                            </button>
                            <button
                              onClick={() => { setLoggingBillId(null); setLogAmount(''); }}
                              className="p-2 border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg text-[#6f7881] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors"
                            >
                              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setLoggingBillId(bill.id); setLogAmount(String(saved)); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#bec7d1] dark:border-[#3a3d40] text-[12px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors"
                          >
                            <Coins className="w-3.5 h-3.5 text-[#ca850c]" strokeWidth={1.5} />
                            Set aside savings
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ── Add Recurring Bill Panel ───────────────────────── */}
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 space-y-4">
          <h2 className="text-[14px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
            Add Recurring Bill
          </h2>

          <form onSubmit={handleAddBill} className="space-y-3.5">
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Bill Name</label>
              <input
                type="text"
                placeholder="e.g. Netflix, Wifi Bill"
                required
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
                className={inputClass}
                disabled={addingBill}
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Monthly Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-[#6f7881]">₱</span>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className={`${inputClass} pl-7 font-mono tabular-nums`}
                  disabled={addingBill}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Start Date</label>
              <input
                type="date"
                required
                value={newBillStartDate}
                onChange={(e) => setNewBillStartDate(e.target.value)}
                className={inputClass}
                disabled={addingBill}
              />
            </div>

            {addError && (
              <p className="text-[11px] text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg">{addError}</p>
            )}

            <button
              type="submit"
              disabled={addingBill}
              className="w-full py-2 bg-[#006492] hover:bg-[#004b6f] text-white text-[13px] font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {addingBill ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />}
              Add Bill
            </button>
          </form>
        </div>
      </div>

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete recurring bill?"
        description={deleteTarget ? `Remove "${deleteTarget.name}" (${formatCurrency(deleteTarget.amount)}/mo)? All saved progress for this bill will also be deleted.` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {undoToast && undoToast.visible && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-[#191c1d] dark:bg-[#e2e4e5] text-white dark:text-[#191c1d] rounded-xl shadow-lg border border-white/10 dark:border-black/10 min-w-[280px] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-[13px] font-medium">{undoToast.message}</span>
          <button
            onClick={handleUndoBill}
            className="text-[13px] font-bold text-[#2D9CDB] hover:text-[#006492] dark:hover:text-[#54b4eb] cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </>
  )
}
