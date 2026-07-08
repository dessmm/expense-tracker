import type { Database } from './database.types'

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']


export type Allowance = Database['public']['Tables']['allowances']['Row']
export type AllowanceInsert = Database['public']['Tables']['allowances']['Insert']

export type RecurringBill = Database['public']['Tables']['recurring_bills']['Row']
export type RecurringBillInsert = Database['public']['Tables']['recurring_bills']['Insert']

export type BillSavingsProgress = Database['public']['Tables']['bill_savings_progress']['Row']
export type BillSavingsProgressInsert = Database['public']['Tables']['bill_savings_progress']['Insert']

export type Category = 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'Health' | 'Other'

export const CATEGORIES: Category[] = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Other']

export interface CategoryBreakdown {
  category: Category
  amount: number
  percentage: number
  count: number
}

export interface CategoryBudget {
  id: string
  user_id: string
  category: Category
  monthly_cap: number
  month: string
  created_at: string
}

export interface CategoryBudgetInsert {
  id?: string
  user_id?: string
  category: Category
  monthly_cap: number
  month: string
  created_at?: string
}

export type SavingsGoal = Database['public']['Tables']['savings_goals']['Row']
export type SavingsGoalInsert = Database['public']['Tables']['savings_goals']['Insert']

export type ExpenseTemplate = Database['public']['Tables']['expense_templates']['Row']
export type ExpenseTemplateInsert = Database['public']['Tables']['expense_templates']['Insert']

export interface Income {
  id: string
  user_id: string
  amount: number
  source: string
  date: string
  note: string | null
  created_at: string
}

export interface IncomeInsert {
  id?: string
  user_id?: string
  amount: number
  source: string
  date: string
  note?: string | null
  created_at?: string
}
