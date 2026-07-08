import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMonth, getMonthDateRange } from '@/lib/utils'
import { IncomeClient } from '@/components/income/IncomeClient'
import type { Income } from '@/lib/types'

export const metadata = {
  title: 'Income Tracker — Zenith Ledger',
}

interface IncomePageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function IncomePage({ searchParams }: IncomePageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const resolvedParams = await searchParams
  const month = resolvedParams.month || getCurrentMonth()
  const monthRange = getMonthDateRange(month)

  try {
    const { data: incomes, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthRange.start)
      .lte('date', monthRange.end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return (
      <IncomeClient
        initialIncomes={(incomes as Income[]) ?? []}
        currentMonth={month}
      />
    )
  } catch (err: any) {
    console.error('Error fetching income:', err)
    return (
      <IncomeClient
        initialIncomes={[]}
        currentMonth={month}
        error="Failed to load your income details. Please refresh or try again later."
      />
    )
  }
}
