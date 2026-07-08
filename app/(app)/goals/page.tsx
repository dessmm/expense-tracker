import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoalsClient } from '@/components/goals/GoalsClient'
import type { SavingsGoal } from '@/lib/types'

export const metadata = {
  title: 'Savings Goals — Zenith Ledger',
}

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    const { data: goals, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (
      <GoalsClient
        initialGoals={(goals as SavingsGoal[]) ?? []}
      />
    )
  } catch (err) {
    console.error('Error loading savings goals:', err)
    return (
      <GoalsClient
        initialGoals={[]}
        error="Couldn't load your savings goals. Please check your connection and try refreshing."
      />
    )
  }
}
