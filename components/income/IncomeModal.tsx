import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayDate } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'
import type { Income } from '@/lib/types'

interface IncomeModalProps {
  open: boolean
  income?: Income
  onClose: () => void
  onSuccess: (income: Income) => void
}

export function IncomeModal({ open, income, onClose, onSuccess }: IncomeModalProps) {
  const isEditing = !!income
  const supabase = createClient()

  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [date, setDate] = useState(getTodayDate())
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (income) {
        setAmount(String(income.amount))
        setSource(income.source)
        setDate(income.date)
        setNote(income.note || '')
      } else {
        setAmount('')
        setSource('')
        setDate(getTodayDate())
        setNote('')
      }
      setError(null)
    }
  }, [open, income])

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

    const trimmedSource = source.trim()
    if (!trimmedSource) {
      setError('Please enter a source')
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
      setError('You must be logged in to modify income.')
      setLoading(false)
      return
    }

    const payload = {
      amount: amountNum,
      source: trimmedSource,
      date,
      note: note.trim() || null
    }

    try {
      if (isEditing && income) {
        const { data, error: dbErr } = await supabase
          .from('income')
          .update(payload)
          .eq('id', income.id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (dbErr) throw dbErr
        onSuccess(data as Income)
      } else {
        const { data, error: dbErr } = await supabase
          .from('income')
          .insert({
            ...payload,
            user_id: user.id
          })
          .select()
          .single()

        if (dbErr) throw dbErr
        onSuccess(data as Income)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Database error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e1e3e4] dark:border-[#3a3d40] flex items-center justify-between bg-[#f8f9fa] dark:bg-[#1e2124]">
          <h3 className="text-[16px] font-display font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
            {isEditing ? 'Edit Income' : 'Add Income'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#e1e3e4] dark:hover:bg-[#3a3d40] text-[#6f7881] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block label-caps text-[#6f7881] mb-2">Amount (₱)</label>
            <input
              type="number"
              step="any"
              required
              disabled={loading}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="
                w-full px-3 py-2.5 text-[15px] font-semibold
                bg-[#f3f4f5] dark:bg-[#1a1c1e]
                border border-[#bec7d1] dark:border-[#3a3d40]
                rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
                placeholder-[#bec7d1] outline-none
                focus:border-[#006492] focus:ring-2 focus:ring-[#006492]/15
                transition-all
              "
            />
          </div>

          <div>
            <label className="block label-caps text-[#6f7881] mb-2">Source</label>
            <input
              type="text"
              required
              disabled={loading}
              placeholder="e.g. Freelance, Allowance, Part-time job"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="
                w-full px-3 py-2.5 text-[13px]
                bg-[#f3f4f5] dark:bg-[#1a1c1e]
                border border-[#bec7d1] dark:border-[#3a3d40]
                rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
                placeholder-[#bec7d1] outline-none
                focus:border-[#006492] focus:ring-2 focus:ring-[#006492]/15
                transition-all
              "
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block label-caps text-[#6f7881] mb-2">Date</label>
              <input
                type="date"
                required
                disabled={loading}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="
                  w-full px-3 py-2.5 text-[13px]
                  bg-[#f3f4f5] dark:bg-[#1a1c1e]
                  border border-[#bec7d1] dark:border-[#3a3d40]
                  rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
                  outline-none focus:border-[#006492] focus:ring-2 focus:ring-[#006492]/15
                  transition-all
                "
              />
            </div>
            <div>
              <label className="block label-caps text-[#6f7881] mb-2">Note (optional)</label>
              <input
                type="text"
                disabled={loading}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Monthly salary"
                className="
                  w-full px-3 py-2.5 text-[13px]
                  bg-[#f3f4f5] dark:bg-[#1a1c1e]
                  border border-[#bec7d1] dark:border-[#3a3d40]
                  rounded-lg text-[#191c1d] dark:text-[#e2e4e5]
                  placeholder-[#bec7d1] outline-none
                  focus:border-[#006492] focus:ring-2 focus:ring-[#006492]/15
                  transition-all
                "
              />
            </div>
          </div>

          {error && (
            <div className="text-[13px] text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
              {isEditing ? 'Save changes' : 'Add income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
