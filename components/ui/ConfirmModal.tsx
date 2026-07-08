'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
  error = null,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white dark:bg-[#232629] border border-[#bec7d1] dark:border-[#3a3d40] rounded-2xl w-full max-w-[360px] shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[#191c1d] dark:text-[#e2e4e5]">
              {title}
            </h2>
            <p className="text-[13px] text-[#6f7881] mt-0.5">
              {description}
            </p>
          </div>
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
            className="flex-1 py-2.5 border border-[#bec7d1] dark:border-[#3a3d40] text-[14px] font-medium text-[#3f4850] dark:text-[#9aacb5] rounded-lg hover:bg-[#f3f4f5] dark:hover:bg-[#2e3132] transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-[14px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
