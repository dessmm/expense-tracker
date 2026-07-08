import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMonth } from '@/lib/utils'
import { BillsClient } from '@/components/bills/BillsClient'
import type { RecurringBill, BillSavingsProgress } from '@/lib/types'

export const metadata = {
  title: 'Bills & Savings — Zenith Ledger',
}

export default async function BillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const month = getCurrentMonth()

  try {
    const [billsRes, progressRes] = await Promise.all([
      supabase
        .from('recurring_bills')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('bill_savings_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
    ])

    if (billsRes.error || progressRes.error) {
      throw new Error(billsRes.error?.message || progressRes.error?.message || 'Database error')
    }

    return (
      <BillsClient
        initialMonth={month}
        initialBills={(billsRes.data as RecurringBill[]) ?? []}
        initialProgress={(progressRes.data as BillSavingsProgress[]) ?? []}
      />
    )
  } catch (err) {
    console.error('Error fetching bills:', err)
    return (
      <BillsClient
        initialMonth={month}
        initialBills={[]}
        initialProgress={[]}
        error="Couldn't load your bills data. Please check your connection and try refreshing."
      />
    )
  }
}
