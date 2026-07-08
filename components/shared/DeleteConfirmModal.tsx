'use client'

import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface DeleteConfirmModalProps {
  open: boolean
  title: string
  description: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

/**
 * Generic reusable delete confirmation modal.
 * Shows a title, description, and confirms destructive action.
 */
export function DeleteConfirmModal({
  open,
  title,
  description,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl w-full max-w-[380px] shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
              {title}
            </h2>
            <p className="text-[13px] text-[#6f7881] mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-[#f3f4f5] dark:bg-[#1a1c1e] rounded-lg px-4 py-3 mb-5">
          <p className="text-[13px] text-[#3f4850] dark:text-[#9aacb5]">
            {description}
          </p>
        </div>

        {error && (
          <div className="text-[13px] text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 min-h-[44px] border border-[#bec7d1] dark:border-[#3a3d40] text-[14px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 min-h-[44px] bg-[#ba1a1a] hover:bg-[#93000a] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
