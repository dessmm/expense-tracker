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
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          amount: number
          category: string
          note?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          note?: string | null
          date?: string
          created_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          monthly_cap: number
          month: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          category: string
          monthly_cap: number
          month: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          monthly_cap?: number
          month?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
