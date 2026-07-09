'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPendingExpenses, removePendingExpense, updatePendingExpenseStatus, type PendingExpense } from '@/lib/offline-store'

export function OfflineSyncProvider() {
  const [syncing, setSyncing] = useState(false)
  const supabase = createClient()

  const syncQueue = useCallback(async () => {
    if (syncing || !navigator.onLine) return
    
    const pending = await getPendingExpenses()
    if (pending.length === 0) return

    setSyncing(true)
    console.log(`Starting sync for ${pending.length} pending offline expenses...`)

    // Get current authenticated user
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      console.error('Offline sync failed: User session not found or auth expired.')
      for (const item of pending) {
        await updatePendingExpenseStatus(item.localId, 'failed', 'Auth expired. Please log in again.')
        window.dispatchEvent(new CustomEvent('expense-sync-failed', {
          detail: { localId: item.localId, error: 'Auth expired. Please log in again.' }
        }))
      }
      setSyncing(false)
      return
    }

    for (const item of pending) {
      try {
        // Sync item to Supabase
        const payload = {
          user_id: user.id,
          amount: item.amount,
          category: item.category,
          note: item.description,
          tags: item.tags,
          date: item.date,
        }

        const { data, error } = await supabase
          .from('expenses')
          .insert(payload)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }

        // Successfully synced! Remove from IndexedDB queue
        await removePendingExpense(item.localId)
        console.log(`Successfully synced expense: ${item.localId} -> DB ID: ${data.id}`)

        // Dispatch success event to update local React states
        window.dispatchEvent(new CustomEvent('expense-synced', {
          detail: { localId: item.localId, expense: data }
        }))
      } catch (err: any) {
        console.error(`Failed to sync expense ${item.localId}:`, err)
        const errorMsg = err.message || 'Sync failed'
        await updatePendingExpenseStatus(item.localId, 'failed', errorMsg)
        
        // Dispatch failure event
        window.dispatchEvent(new CustomEvent('expense-sync-failed', {
          detail: { localId: item.localId, error: errorMsg }
        }))
      }
    }

    setSyncing(false)
  }, [supabase, syncing])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Sync on mount (in case there are leftovers)
      syncQueue()

      // Sync when connection comes back online
      window.addEventListener('online', syncQueue)
      
      // Also register a custom event listener to allow manual retries to trigger sync
      const handleManualSync = () => {
        syncQueue()
      }
      window.addEventListener('trigger-offline-sync', handleManualSync)

      return () => {
        window.removeEventListener('online', syncQueue)
        window.removeEventListener('trigger-offline-sync', handleManualSync)
      }
    }
  }, [syncQueue])

  return null
}
