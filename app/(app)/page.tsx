import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentMonth, getCurrentWeekRange, navigateMonth, getMonthDateRange } from '@/lib/utils'
import { OverviewClient } from '@/components/overview/OverviewClient'
import type { Expense, Allowance, RecurringBill, BillSavingsProgress, SavingsGoal, CategoryBudget, Income } from '@/lib/types'

export const metadata = {
  title: 'Overview — Zenith Ledger',
}

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const month = getCurrentMonth()
  const prevMonth = navigateMonth(month, 'prev')
  const { weekStart, weekEnd } = getCurrentWeekRange()

  const monthRange = getMonthDateRange(month)
  const prevMonthRange = getMonthDateRange(prevMonth)

  try {
    // Fetch all necessary data in parallel
    const [
      { data: thisMonthExpenses, error: thisMonthErr },
      { data: lastMonthExpensesRes, error: lastMonthErr },
      { data: weekExpensesRes, error: weekErr },
      { data: currentAllowanceRes, error: allowanceErr },
      { data: billsRes, error: billsErr },
      { data: progressRes, error: progressErr },
      { data: budgetsRes, error: budgetsErr },
      { data: goalsRes, error: goalsErr },
      { data: incomeRes, error: incomeErr },
    ] = await Promise.all([
      // Current month's expenses
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthRange.start)
        .lte('date', monthRange.end),

      // Last month's expenses (for MoM comparison)
      supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', prevMonthRange.start)
        .lte('date', prevMonthRange.end),

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

      // Savings goals
      supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),

      // This month's income (informational — does NOT affect allowance)
      supabase
        .from('income')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', monthRange.start)
        .lte('date', monthRange.end),
    ])

    // Check for any query errors
    if (
      thisMonthErr || 
      lastMonthErr || 
      weekErr || 
      allowanceErr || 
      billsErr || 
      progressErr || 
      budgetsErr || 
      goalsErr
      // Note: incomeErr is intentionally NOT fatal — income table may not exist yet
    ) {
      const firstError = thisMonthErr?.message || lastMonthErr?.message || weekErr?.message || allowanceErr?.message || billsErr?.message || progressErr?.message || budgetsErr?.message || goalsErr?.message
      throw new Error(firstError || 'Supabase query error')
    }

    const totalIncomeThisMonth = (incomeRes ?? []).reduce(
      (sum, e) => sum + (e.amount as number),
      0
    )

    const thisMonthSpent = (thisMonthExpenses ?? []).reduce(
      (sum, e) => sum + (e.amount as number),
      0
    )

    const lastMonthSpent = (lastMonthExpensesRes ?? []).reduce(
      (sum, e) => sum + (e.amount as number),
      0
    )

    const spentThisWeek = (weekExpensesRes ?? []).reduce(
      (sum, e) => sum + (e.amount as number),
      0
    )

    return (
      <OverviewClient
        currentMonth={month}
        previousMonth={prevMonth}
        thisMonthSpent={thisMonthSpent}
        lastMonthSpent={lastMonthSpent}
        totalIncomeThisMonth={totalIncomeThisMonth}
        allowance={(currentAllowanceRes as Allowance) ?? null}
        spentThisWeek={spentThisWeek}
        bills={(billsRes as RecurringBill[]) ?? []}
        billProgress={(progressRes as BillSavingsProgress[]) ?? []}
        goals={(goalsRes as SavingsGoal[]) ?? []}
        budgets={(budgetsRes as CategoryBudget[]) ?? []}
        monthExpenses={(thisMonthExpenses as Expense[]) ?? []}
      />
    )
  } catch (err) {
    console.error('Error fetching Overview data:', err)
    return (
      <OverviewClient
        currentMonth={month}
        previousMonth={prevMonth}
        thisMonthSpent={0}
        lastMonthSpent={0}
        totalIncomeThisMonth={0}
        allowance={null}
        spentThisWeek={0}
        bills={[]}
        billProgress={[]}
        goals={[]}
        budgets={[]}
        monthExpenses={[]}
        error="Couldn't load your financial overview. Please check your connection and try refreshing."
      />
    )
  }
}
