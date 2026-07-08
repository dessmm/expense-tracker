export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          note: string | null
          tags: string[] | null
          date: string
          is_shared: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          amount: number
          category: string
          note?: string | null
          tags?: string[] | null
          date: string
          is_shared?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          note?: string | null
          tags?: string[] | null
          date?: string
          is_shared?: boolean
          created_at?: string
        }
      }

      allowances: {
        Row: {
          id: string
          user_id: string
          amount: number
          week_start: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          amount: number
          week_start: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          week_start?: string
          created_at?: string
        }
      }
      recurring_bills: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          start_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          amount: number
          start_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          start_date?: string
          created_at?: string
        }
      }
      bill_savings_progress: {
        Row: {
          id: string
          user_id: string
          bill_id: string
          month: string
          amount_saved: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          bill_id: string
          month: string
          amount_saved?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bill_id?: string
          month?: string
          amount_saved?: number
          created_at?: string
        }
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          target_date: string
          amount_saved: number
          priority: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          target_amount: number
          target_date: string
          amount_saved?: number
          priority?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          target_date?: string
          amount_saved?: number
          priority?: number | null
          created_at?: string
        }
      }
      expense_templates: {
        Row: {
          id: string
          user_id: string
          label: string
          amount: number
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          label: string
          amount: number
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          amount?: number
          category?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
