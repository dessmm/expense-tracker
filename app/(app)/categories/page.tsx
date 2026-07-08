import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMonth, getMonthDateRange } from '@/lib/utils'
import { CategoriesClient } from '@/components/categories/CategoriesClient'
import type { Expense } from '@/lib/types'

export const metadata = {
  title: 'Categories — Zenith Ledger',
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const month = getCurrentMonth()
  const monthRange = getMonthDateRange(month)

  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthRange.start)
      .lte('date', monthRange.end)
      .order('date', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (
      <CategoriesClient
        initialExpenses={(expenses as Expense[]) ?? []}
        initialMonth={month}
      />
    )
  } catch (err) {
    console.error('Error loading categories:', err)
    return (
      <CategoriesClient
        initialExpenses={[]}
        initialMonth={month}
        error="Couldn't load your category data. Please check your connection and try refreshing."
      />
    )
  }
}
