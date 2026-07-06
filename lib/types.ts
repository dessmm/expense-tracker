import type { Database } from './database.types'

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export type Budget = Database['public']['Tables']['budgets']['Row']
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert']

export type Category = 'Food' | 'Transport' | 'Bills' | 'Shopping' | 'Health' | 'Other'

export const CATEGORIES: Category[] = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Other']

export interface CategoryBreakdown {
  category: Category
  amount: number
  percentage: number
  count: number
}
