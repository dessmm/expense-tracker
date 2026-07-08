import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMonth, getCurrentWeekRange, getLastWeekRange, getTwoWeeksAgoRange, getMonthDateRange } from '@/lib/utils'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import type { Expense, Allowance, RecurringBill, BillSavingsProgress } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const month = getCurrentMonth()
  const { weekStart, weekEnd } = getCurrentWeekRange()
  const { weekStart: lastWeekStart, weekEnd: lastWeekEnd } = getLastWeekRange()
  const { weekStart: twoWeeksAgoStart, weekEnd: twoWeeksAgoEnd } = getTwoWeeksAgoRange()

  const monthRange = getMonthDateRange(month)

  try {
    // Fetch all necessary data in parallel
    const [
      { data: expenses, error: expensesErr },
      { data: monthAllowances, error: allowancesErr },
      { data: weekExpenses, error: weekExpensesErr },
      { data: currentAllowance, error: currentAllowanceErr },
      { data: bills, error: billsErr },
      { data: progress, error: progressErr },
      { data: budgets, error: budgetsErr },
      { data: templates, error: templatesErr },
      { data: lastAllowance, error: lastAllowanceErr },
      { data: lastExpenses, error: lastExpensesErr },
      { data: twoWeeksAgoExpenses, error: twoWeeksAgoExpensesErr },
    ] = await Promise.all([
      // Current month's expenses
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthRange.start)
        .lte('date', monthRange.end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),

      // All allowances set for weeks starting within the current month
      supabase
        .from('allowances')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start', monthRange.start)
        .lte('week_start', monthRange.end),

      // This week's expenses (for current week sum calculation)
      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd),

      // Current week's allowance
      supabase
        .from('allowances')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle(),

      // Recurring bills
      supabase
        .from('recurring_bills')
        .select('*')
        .eq('user_id', user.id),

      // Monthly progress of bill savings
      supabase
        .from('bill_savings_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month),

      // Category budgets
      supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month),

      // Expense templates
      supabase
        .from('expense_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // Last week's allowance
      supabase
        .from('allowances')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', lastWeekStart)
        .maybeSingle(),

      // Last week's expenses (selecting both amount and category)
      supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', user.id)
        .gte('date', lastWeekStart)
        .lte('date', lastWeekEnd),

      // Two weeks ago expenses (for comparison)
      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', twoWeeksAgoStart)
        .lte('date', twoWeeksAgoEnd)
    ])

    // Check for query errors
    if (
      expensesErr || allowancesErr || weekExpensesErr || currentAllowanceErr || 
      billsErr || progressErr || budgetsErr || templatesErr || 
      lastAllowanceErr || lastExpensesErr || twoWeeksAgoExpensesErr
    ) {
      throw new Error('Supabase query failed')
    }

    const spentThisWeek = (weekExpenses ?? []).reduce(
      (sum, e) => sum + (e.amount as number),
      0
    )

    const lastWeekSpent = (lastExpenses ?? []).reduce(
      (sum, e) => sum + (e.amount as number),
      0
    )
    const lastWeekAllowanceAmount = lastAllowance ? Number(lastAllowance.amount) : null

    // Find top category for last week
    const categorySums: Record<string, number> = {}
    for (const e of lastExpenses ?? []) {
      const cat = e.category ?? 'Uncategorized'
      categorySums[cat] = (categorySums[cat] ?? 0) + (e.amount as number)
    }
    let lastWeekTopCategory: string | null = null
    let maxSpent = 0
    for (const [cat, sum] of Object.entries(categorySums)) {
      if (sum > maxSpent) {
        maxSpent = sum
        lastWeekTopCategory = cat
      }
    }

    const twoWeeksAgoSpent = (twoWeeksAgoExpenses ?? []).reduce(
      (sum, e) => sum + (e.amount as number),
      0
    )

    return (
      <DashboardClient
        initialExpenses={(expenses as Expense[]) ?? []}
        initialAllowances={(monthAllowances as Allowance[]) ?? []}
        initialMonth={month}
        spentThisWeek={spentThisWeek}
        allowance={(currentAllowance as Allowance) ?? null}
        initialBills={(bills as RecurringBill[]) ?? []}
        initialProgress={(progress as BillSavingsProgress[]) ?? []}
        initialBudgets={(budgets as any[]) ?? []}
        initialTemplates={(templates as any[]) ?? []}
        lastWeekStart={lastWeekStart}
        lastWeekEnd={lastWeekEnd}
        lastWeekSpent={lastWeekSpent}
        lastWeekAllowanceAmount={lastWeekAllowanceAmount}
        lastWeekTopCategory={lastWeekTopCategory}
        twoWeeksAgoSpent={twoWeeksAgoSpent}
      />
    )
  } catch (err) {
    console.error('Error loading dashboard:', err)
    return (
      <DashboardClient
        initialExpenses={[]}
        initialAllowances={[]}
        initialMonth={month}
        spentThisWeek={0}
        allowance={null}
        initialBills={[]}
        initialProgress={[]}
        initialBudgets={[]}
        initialTemplates={[]}
        lastWeekStart={lastWeekStart}
        lastWeekEnd={lastWeekEnd}
        lastWeekSpent={0}
        lastWeekAllowanceAmount={null}
        lastWeekTopCategory={null}
        twoWeeksAgoSpent={0}
        error="Couldn't load your dashboard data. Please check your connection and try refreshing."
      />
    )
  }
}
