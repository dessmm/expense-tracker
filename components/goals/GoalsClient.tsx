'use client'

import { useState, useMemo, useCallback } from 'react'
import { formatCurrency, getWeeksRemaining, getTodayPHTDate } from '@/lib/utils'
import { Plus, Trash2, CalendarDays, Coins, Check, X, Loader2, Pencil, Target, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { DeleteConfirmModal } from '@/components/shared/DeleteConfirmModal'
import type { SavingsGoal } from '@/lib/types'

interface GoalsClientProps {
  initialGoals: SavingsGoal[]
  error?: string
}

export function GoalsClient({ initialGoals, error }: GoalsClientProps) {
  const [goals, setGoals] = useState<SavingsGoal[]>(initialGoals)
  
  // Modal & form states
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  
  const [goalName, setGoalName] = useState('')
  const [goalTargetAmount, setGoalTargetAmount] = useState('')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [undoToast, setUndoToast] = useState<{
    visible: boolean
    message: string
    data: SavingsGoal
  } | null>(null)

  // Quick-log savings state per goal
  const [loggingGoalId, setLoggingGoalId] = useState<string | null>(null)
  const [logAmount, setLogAmount] = useState('')
  const [loggingProgress, setLoggingProgress] = useState(false)

  // Reorder: true while a PUT is in-flight
  const [reordering, setReordering] = useState(false)

  // Reset form helper
  const resetForm = () => {
    setGoalName('')
    setGoalTargetAmount('')
    setGoalTargetDate('')
    setFormError(null)
    setEditingGoal(null)
  }

  // Handle Add / Edit submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const name = goalName.trim()
    const targetAmount = parseFloat(goalTargetAmount)
    const targetDate = goalTargetDate

    if (!name) {
      setFormError('Goal name is required')
      return
    }
    if (isNaN(targetAmount) || targetAmount <= 0) {
      setFormError('Enter a valid target amount greater than 0')
      return
    }
    if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      setFormError('Select a valid target date')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingGoal) {
        // Edit existing goal
        const res = await fetch('/api/savings_goals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingGoal.id,
            name,
            target_amount: targetAmount,
            target_date: targetDate,
          }),
        })

        if (res.ok) {
          const updated = await res.json()
          setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))
          setShowAddModal(false)
          resetForm()
        } else {
          const err = await res.json()
          setFormError(err.error || 'Failed to update goal')
        }
      } else {
        // Create new goal
        const res = await fetch('/api/savings_goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            target_amount: targetAmount,
            target_date: targetDate,
          }),
        })

        if (res.ok) {
          const created = await res.json()
          setGoals(prev => [created, ...prev])
          setShowAddModal(false)
          resetForm()
        } else {
          const err = await res.json()
          setFormError(err.error || 'Failed to create goal')
        }
      }
    } catch {
      setFormError('A network error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  async function handleDeleteConfirm() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/savings_goals?id=${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setUndoToast({
          visible: true,
          message: `Goal "${deleteTarget.name}" deleted.`,
          data: deleteTarget
        })
        const removedId = deleteTarget.id
        setTimeout(() => {
          setUndoToast(prev => prev?.data.id === removedId ? null : prev)
        }, 5000)

        setGoals(prev => prev.filter(g => g.id !== deleteTarget.id))
        setDeleteTarget(null)
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  async function handleUndoGoal() {
    if (!undoToast) return
    const goal = undoToast.data

    try {
      const res = await fetch('/api/savings_goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: goal.name,
          target_amount: goal.target_amount,
          target_date: goal.target_date,
        })
      })

      if (res.ok) {
        const restoredGoal = await res.json()

        if (goal.amount_saved > 0) {
          const patchRes = await fetch('/api/savings_goals', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: restoredGoal.id,
              amount_saved: goal.amount_saved,
            })
          })
          if (patchRes.ok) {
            const finalRestored = await patchRes.json()
            setGoals(prev => [finalRestored, ...prev])
            return
          }
        }

        setGoals(prev => [restoredGoal, ...prev])
      }
    } catch {
      // ignore
    } finally {
      setUndoToast(null)
    }
  }

  // Open Edit Modal
  function startEdit(goal: SavingsGoal) {
    setEditingGoal(goal)
    setGoalName(goal.name)
    setGoalTargetAmount(String(goal.target_amount))
    setGoalTargetDate(goal.target_date)
    setShowAddModal(true)
  }

  // Move a goal up or down in priority order (optimistic + persisted)
  const handleMove = useCallback(async (goalId: string, direction: 'up' | 'down') => {
    if (reordering) return
    setGoals(prev => {
      const idx = prev.findIndex(g => g.id === goalId)
      if (idx < 0) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev

      const next = [...prev]
      // Swap positions
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })

    // Persist new order via PUT
    setReordering(true)
    try {
      // Re-read current state after optimistic update
      setGoals(prev => {
        const updates = prev.map((g, i) => ({ id: g.id, priority: i + 1 }))
        // Fire-and-forget inside the setter so we have the latest order
        fetch('/api/savings_goals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        }).catch(() => { /* non-fatal */ }).finally(() => setReordering(false))
        return prev
      })
    } catch {
      setReordering(false)
    }
  }, [reordering])

  // Log additional savings toward goal
  async function handleAddSavings(goalId: string, currentSaved: number) {
    if (loggingProgress) return
    const additional = parseFloat(logAmount)
    if (isNaN(additional) || additional <= 0) return

    setLoggingProgress(true)
    try {
      const res = await fetch('/api/savings_goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goalId,
          amount_saved: currentSaved + additional,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setGoals(prev => prev.map(g => g.id === goalId ? updated : g))
        setLoggingGoalId(null)
        setLogAmount('')
      }
    } catch {
      // ignore
    } finally {
      setLoggingProgress(false)
    }
  }

  // Format relative distance
  function formatRelativeTime(targetDateStr: string): string {
    const todayStr = getTodayPHTDate()
    const [y1, m1, d1] = todayStr.split('-').map(Number)
    const [y2, m2, d2] = targetDateStr.split('-').map(Number)
    const today = new Date(y1, m1 - 1, d1, 12, 0, 0)
    const targetDate = new Date(y2, m2 - 1, d2, 12, 0, 0)
    
    const msDiff = targetDate.getTime() - today.getTime()
    const daysDiff = Math.round(msDiff / (1000 * 60 * 60 * 24))

    if (daysDiff < 0) {
      return 'past target date'
    }
    if (daysDiff === 0) return 'target date is today'
    if (daysDiff === 1) return 'target date is tomorrow'
    if (daysDiff < 14) return `in ${daysDiff} days`

    const weeks = Math.round(daysDiff / 7)
    if (weeks < 8) {
      return `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
    }

    const months = Math.round(daysDiff / 30)
    return `in ${months} ${months === 1 ? 'month' : 'months'}`
  }

  // Memoize goal calculations
  const goalsWithCalculations = useMemo(() => {
    const todayStr = getTodayPHTDate()
    const [y, m, d] = todayStr.split('-').map(Number)
    const today = new Date(y, m - 1, d, 12, 0, 0)

    return goals.map(goal => {
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

      return {
        goal,
        weeksRemaining,
        remainingToSave,
        weeklyTarget,
        savedPercentage,
        formattedTargetDate,
        relativeDistance: formatRelativeTime(goal.target_date)
      }
    })
  }, [goals])

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
            Savings Goals
          </h1>
          <p className="text-[13px] text-[#6f7881] mt-0.5">
            Track and build savings for major milestones and purchases
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#006492] hover:bg-[#004b6f] text-white text-[13.5px] font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Create Goal
        </button>
      </div>

      {/* Goals grid */}
      {goalsWithCalculations.length === 0 ? (
        <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-16 text-center max-w-[700px] mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#e8f4fb] dark:bg-[#1a3040] flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7 text-[#2D9CDB]" strokeWidth={1.5} />
          </div>
          <p className="text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] mb-1">No savings goals yet</p>
          <p className="text-[13px] text-[#6f7881] mb-6">Create a goal to calculate your weekly savings targets and monitor your progress.</p>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2 bg-[#006492] hover:bg-[#004b6f] text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
          >
            Add your first goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {goalsWithCalculations.map(({
            goal,
            weeksRemaining,
            remainingToSave,
            weeklyTarget,
            savedPercentage,
            formattedTargetDate,
            relativeDistance
          }, goalIndex) => (
            <div
              key={goal.id}
              className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl p-5 space-y-4 shadow-sm"
            >
              {/* Goal Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[16px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tracking-tight">
                    {goal.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6f7881]">
                    <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Target: {formattedTargetDate}</span>
                    <span>·</span>
                    <span>{relativeDistance}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-[16px] font-semibold text-[#191c1d] dark:text-[#e2e4e5] tabular-nums">
                      {formatCurrency(goal.target_amount)}
                    </span>
                    <span className="block text-[10px] text-[#6f7881]">goal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Priority reorder buttons */}
                    <button
                      onClick={() => handleMove(goal.id, 'up')}
                      disabled={goalIndex === 0 || reordering}
                      className="p-1.5 rounded-lg text-[#bec7d1] hover:text-[#006492] hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleMove(goal.id, 'down')}
                      disabled={goalIndex === goalsWithCalculations.length - 1 || reordering}
                      className="p-1.5 rounded-lg text-[#bec7d1] hover:text-[#006492] hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                    </button>

                    <div className="w-px h-4 bg-[#e1e3e4] dark:bg-[#3a3d40] mx-0.5" />

                    <button
                      onClick={() => startEdit(goal)}
                      className="p-1.5 rounded-lg text-[#bec7d1] hover:text-[#006492] hover:bg-[#e8f4fb] dark:hover:bg-[#1a3040] transition-colors cursor-pointer"
                      title="Edit goal"
                    >
                      <Pencil className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(goal)}
                      className="p-1.5 rounded-lg text-[#bec7d1] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#6f7881]">Saved: {formatCurrency(goal.amount_saved)}</span>
                  <span className="font-medium text-[#191c1d] dark:text-[#e2e4e5]">{savedPercentage}%</span>
                </div>

                <div className="h-2 bg-[#edeeef] dark:bg-[#2e3132] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#27ae60] rounded-full transition-all duration-300"
                    style={{ width: `${savedPercentage}%` }}
                  />
                </div>
              </div>

              {/* Target & Inline Savings logging */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#e1e3e4] dark:border-[#2e3132] pt-4 mt-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#6f7881] font-semibold">Weekly Target</p>
                  <p className="font-mono text-[15px] font-bold text-[#006492] dark:text-[#2D9CDB] mt-0.5 tabular-nums">
                    {remainingToSave === 0 ? '₱0.00' : `${formatCurrency(weeklyTarget)}`}
                  </p>
                </div>

                {loggingGoalId === goal.id ? (
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
                      onClick={() => handleAddSavings(goal.id, goal.amount_saved)}
                      disabled={loggingProgress}
                      className="p-2 bg-[#27ae60] hover:bg-[#1e7e44] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {loggingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                    </button>
                    <button
                      onClick={() => { setLoggingGoalId(null); setLogAmount(''); }}
                      className="p-2 border border-[#bec7d1] dark:border-[#3a3d40] rounded-lg text-[#6f7881] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setLoggingGoalId(goal.id); setLogAmount(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#bec7d1] dark:border-[#3a3d40] text-[12px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors cursor-pointer"
                  >
                    <Coins className="w-3.5 h-3.5 text-[#ca850c]" strokeWidth={1.5} />
                    Add to savings
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] w-full max-w-md p-6 rounded-2xl shadow-xl space-y-4 m-4">
            <div className="flex justify-between items-center">
              <h2 className="text-[17px] font-bold text-[#191c1d] dark:text-[#e2e4e5]">
                {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-1 rounded-lg text-[#6f7881] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Laptop, Travel Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-[#6f7881]">₱</span>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    value={goalTargetAmount}
                    onChange={(e) => setGoalTargetAmount(e.target.value)}
                    className={`${inputClass} pl-7 font-mono tabular-nums`}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#6f7881] mb-1.5">Target Date</label>
                <input
                  type="date"
                  required
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-lg text-[12px]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 py-2 border border-[#bec7d1] dark:border-[#3a3d40] text-[13px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-[#006492] hover:bg-[#004b6f] text-white text-[13px] font-medium rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete savings goal?"
        description={deleteTarget ? `Are you sure you want to delete the goal "${deleteTarget.name}"? This action cannot be undone.` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {undoToast && undoToast.visible && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center justify-between gap-4 px-4 py-3 bg-[#191c1d] dark:bg-[#e2e4e5] text-white dark:text-[#191c1d] rounded-xl shadow-lg border border-white/10 dark:border-black/10 min-w-[280px] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-[13px] font-medium">{undoToast.message}</span>
          <button
            onClick={handleUndoGoal}
            className="text-[13px] font-bold text-[#2D9CDB] hover:text-[#006492] dark:hover:text-[#54b4eb] cursor-pointer"
          >
            Undo
          </button>
        </div>
      )}
    </>
  )
}
