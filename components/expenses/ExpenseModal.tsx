import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/types'
import { CATEGORY_ICONS } from '@/lib/category-icons'
import { CATEGORY_BG, getTodayDate, getMonthDateRange } from '@/lib/utils'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import type { Expense, Category } from '@/lib/types'

interface ExpenseModalProps {
  open: boolean
  expense?: Expense
  onClose: () => void
  onSuccess: (expense: Expense, templateAdded?: any) => void
}

export function ExpenseModal({ open, expense, onClose, onSuccess }: ExpenseModalProps) {
  const isEditing = !!expense
  const supabase = createClient()

  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [category, setCategory] = useState<Category>((expense?.category as Category) ?? 'Food')
  const [note, setNote] = useState(expense?.note ?? '')
  const [date, setDate] = useState(expense?.date ?? getTodayDate())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [tagsInput, setTagsInput] = useState(
    expense?.tags
      ? (Array.isArray(expense.tags) ? expense.tags.join(', ') : expense.tags)
      : ''
  )

  const [monthlyCap, setMonthlyCap] = useState<number | null>(null)
  const [otherExpensesSum, setOtherExpensesSum] = useState<number>(0)

  // Reset/sync form state when modal opens or editing expense changes
  useEffect(() => {
    if (open) {
      setAmount(expense ? String(expense.amount) : '')
      setCategory((expense?.category as Category) ?? 'Food')
      setNote(expense?.note ?? '')
      setDate(expense?.date ?? getTodayDate())
      setTagsInput(
        expense?.tags
          ? (Array.isArray(expense.tags) ? expense.tags.join(', ') : expense.tags)
          : ''
      )
      setSaveAsTemplate(false)
      setError(null)
    }
  }, [open, expense])

  useEffect(() => {
    if (!open) {
      setMonthlyCap(null)
      setOtherExpensesSum(0)
      return
    }

    let active = true

    async function fetchBudgetAndExpenses() {
      const selectedMonth = date.slice(0, 7)
      if (!selectedMonth || !category) return

      const capPromise = supabase
        .from('budgets')
        .select('monthly_cap')
        .eq('category', category)
        .eq('month', selectedMonth)
        .maybeSingle()

      const monthRange = getMonthDateRange(selectedMonth)
      let expensesQuery = supabase
        .from('expenses')
        .select('amount')
        .eq('category', category)
        .gte('date', monthRange.start)
        .lte('date', monthRange.end)

      if (isEditing && expense) {
        expensesQuery = expensesQuery.neq('id', expense.id)
      }

      const [capRes, expensesRes] = await Promise.all([capPromise, expensesQuery])

      if (!active) return

      if (capRes.data) {
        setMonthlyCap(Number(capRes.data.monthly_cap))
      } else {
        setMonthlyCap(null)
      }

      if (expensesRes.data) {
        const sum = expensesRes.data.reduce((acc, e) => acc + Number(e.amount), 0)
        setOtherExpensesSum(sum)
      } else {
        setOtherExpensesSum(0)
      }
    }

    fetchBudgetAndExpenses()

    return () => {
      active = false
    }
  }, [open, category, date, expense, isEditing])

  const monthName = useMemo(() => {
    if (!date) return ''
    try {
      const dObj = new Date(date + 'T12:00:00')
      return dObj.toLocaleString('en-US', { month: 'long' })
    } catch {
      return ''
    }
  }, [date])

  const enteredAmount = parseFloat(amount) || 0
  const wouldGoOver = monthlyCap !== null && (otherExpensesSum + enteredAmount > monthlyCap)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    // Use Supabase local session check first (does not require active network round-trip)
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession()
    let user = session?.user ?? null

    if (!user) {
      // Fallback to getUser() if session is not found in cache (e.g. if we are online and it's a fresh flow)
      const { data: { user: onlineUser } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
      user = onlineUser
    }

    if (!user) {
      setError('You must be logged in to add expenses.')
      setLoading(false)
      return
    }

    const tagsArray = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    const tagsValue = tagsArray.length > 0 ? tagsArray : null

    if (isEditing) {
      // UPDATE: user_id stays as-is on the row (RLS USING clause covers this)
      const payload = {
        amount: amountNum,
        category,
        note: note.trim() || null,
        tags: tagsValue,
        date,
      }
      const { data, error: err } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', expense.id)
        .eq('user_id', user.id) // extra safety: only update own rows
        .select()
        .single()

      if (err) { setError(err.message); setLoading(false); return }
      
      // Reset form fields to defaults on success
      setAmount('')
      setCategory('Food')
      setNote('')
      setDate(getTodayDate())
      setTagsInput('')
      setError(null)

      onSuccess(data as Expense)
    } else {
      // INSERT: must explicitly include user_id for RLS WITH CHECK to pass
      const payload = {
        user_id: user.id, // ✅ Required for RLS INSERT policy
        amount: amountNum,
        category,
        note: note.trim() || null,
        tags: tagsValue,
        date,
      }

      const isOfflineMode = typeof window !== 'undefined' && !navigator.onLine

      if (isOfflineMode) {
        try {
          const { queuePendingExpense } = await import('@/lib/offline-store')
          const pending = await queuePendingExpense({
            amount: amountNum,
            category,
            description: note.trim() || null,
            date,
            tags: tagsValue
          })
          
          // Reset form fields to defaults on success
          setAmount('')
          setCategory('Food')
          setNote('')
          setDate(getTodayDate())
          setTagsInput('')
          setSaveAsTemplate(false)
          setError(null)
          
          onSuccess(pending as unknown as Expense)
        } catch (queueErr: any) {
          setError(queueErr.message || 'Failed to queue expense offline')
        } finally {
          setLoading(false)
        }
        return
      }

      const { data, error: err } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single()

      if (err) {
        // Fallback to queue offline if the network failed (e.g. connection lost during submit)
        try {
          console.warn('Supabase insert failed, falling back to offline queue:', err)
          const { queuePendingExpense } = await import('@/lib/offline-store')
          const pending = await queuePendingExpense({
            amount: amountNum,
            category,
            description: note.trim() || null,
            date,
            tags: tagsValue
          })
          
          // Reset form fields to defaults on success
          setAmount('')
          setCategory('Food')
          setNote('')
          setDate(getTodayDate())
          setTagsInput('')
          setSaveAsTemplate(false)
          setError(null)
          
          onSuccess(pending as unknown as Expense)
        } catch (queueErr: any) {
          setError(err.message || 'Failed to queue expense offline')
        } finally {
          setLoading(false)
        }
        return
      }

      let createdTemplate = null
      if (saveAsTemplate) {
        try {
          const { data: tData } = await supabase
            .from('expense_templates')
            .insert({
              user_id: user.id,
              label: note.trim() || `${category} Template`,
              amount: amountNum,
              category,
            })
            .select()
            .single()
          createdTemplate = tData
        } catch {
          // silently ignore template insert errors
        }
      }
      
      // Reset form fields to defaults on success
      setAmount('')
      setCategory('Food')
      setNote('')
      setDate(getTodayDate())
      setTagsInput('')
      setSaveAsTemplate(false)
      setError(null)

      onSuccess(data as Expense, createdTemplate)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl w-full max-w-[440px] shadow-xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e1e3e4] dark:border-[#3a3d40]">
          <h2 className="text-[15px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
            {isEditing ? 'Edit expense' : 'Add expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] text-[#6f7881] transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Amount */}
          <div>
            <label className="block label-caps text-[#6f7881] mb-2">Amount (₱)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] font-mono font-medium text-[#6f7881]">₱</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
            </div>
          </div>

          {/* Category chips */}
          <div>
            <label className="block label-caps text-[#6f7881] mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat]
                const isSelected = category === cat
                const colorClass = CATEGORY_BG[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`
                      flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all
                      ${isSelected
                        ? 'border-[#2D9CDB] bg-[#e8f4fb] dark:bg-[#1a3040]'
                        : 'border-[#e1e3e4] dark:border-[#3a3d40] hover:border-[#bec7d1] hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132]'
                      }
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? colorClass : 'bg-[#f3f4f5] dark:bg-[#2e3132]'}`}>
                      <Icon
                        className={`w-4 h-4 ${isSelected ? '' : 'text-[#6f7881]'}`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-[#006492] dark:text-[#2D9CDB]' : 'text-[#6f7881]'}`}>
                      {cat}
                    </span>
                  </button>
                )
              })}
            </div>
            {wouldGoOver && (
              <div className="mt-2.5 text-[12px] text-[#ca850c] dark:text-[#fbbf24] bg-[#fffbeb] dark:bg-[#2a1f10] border border-[#fef3c7] dark:border-[#4f3a1d] px-3 py-2 rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ca850c] dark:text-[#fbbf24]" strokeWidth={2} />
                <span>This puts {category} over budget for {monthName}</span>
              </div>
            )}
          </div>

          {/* Date + Note row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block label-caps text-[#6f7881] mb-2">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="
                  w-full px-3 py-2.5 text-[13px]
                  bg-[#f3f4f5] dark:bg-[#1a1c1e]
                  border border-[#bec7d1] dark:border-[#3a3d40]
                  rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
                  outline-none focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15
                  transition-all
                "
              />
            </div>
            <div>
              <label className="block label-caps text-[#6f7881] mb-2">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Grocery run"
                className="
                  w-full px-3 py-2.5 text-[13px]
                  bg-[#f3f4f5] dark:bg-[#1a1c1e]
                  border border-[#bec7d1] dark:border-[#3a3d40]
                  rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
                  placeholder-[#bec7d1] outline-none
                  focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15
                  transition-all
                "
              />
            </div>
          </div>

          <div>
            <label className="block label-caps text-[#6f7881] mb-2">Tags (optional, comma-separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. coffee, commute, treats"
              className="
                w-full px-3 py-2.5 text-[13px]
                bg-[#f3f4f5] dark:bg-[#1a1c1e]
                border border-[#bec7d1] dark:border-[#3a3d40]
                rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
                placeholder-[#bec7d1] outline-none
                focus:border-[#2D9CDB] focus:ring-2 focus:ring-[#2D9CDB]/15
                transition-all
              "
            />
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="save-as-template"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 rounded text-[#006492] border-[#bec7d1] dark:border-[#3a3d40] focus:ring-[#006492] accent-[#006492] cursor-pointer"
              />
              <label htmlFor="save-as-template" className="text-[13px] text-[#3f4850] dark:text-[#9aacb5] select-none cursor-pointer">
                Save as quick-add template
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-[13px] text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 min-h-[44px] border border-[#bec7d1] dark:border-[#3a3d40] text-[14px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 min-h-[44px] bg-[#006492] hover:bg-[#004b6f] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
