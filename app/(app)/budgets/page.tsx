import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMonth, getMonthDateRange } from '@/lib/utils'
import { BudgetsClient } from '@/components/budgets/BudgetsClient'
import type { Expense, CategoryBudget } from '@/lib/types'

export const metadata = {
  title: 'Budget Tracker — Zenith Ledger',
}

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const month = getCurrentMonth()
  const monthRange = getMonthDateRange(month)

  try {
    const [expensesRes, budgetsRes] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthRange.start)
        .lte('date', monthRange.end),
      supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
    ])

    if (expensesRes.error || budgetsRes.error) {
      throw new Error(expensesRes.error?.message || budgetsRes.error?.message || 'Database error')
    }

    return (
      <BudgetsClient
        initialMonth={month}
        initialExpenses={(expensesRes.data as Expense[]) ?? []}
        initialBudgets={(budgetsRes.data as CategoryBudget[]) ?? []}
      />
    )
  } catch (err) {
    console.error('Error loading budget tracker:', err)
    return (
      <BudgetsClient
        initialMonth={month}
        initialExpenses={[]}
        initialBudgets={[]}
        error="Couldn't load your budget limits. Please check your connection and try refreshing."
      />
    )
  }
}
