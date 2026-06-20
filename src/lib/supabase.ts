import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      children: {
        Row: {
          id: string
          parent_id: string
          name: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          name: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          name?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          parent_id: string
          child_id: string
          name: string
          category: string | null
          planned_minutes: number
          is_active: boolean
          is_template: boolean
          scheduled_date: string | null
          scheduled_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          child_id: string
          name: string
          category?: string | null
          planned_minutes: number
          is_active?: boolean
          is_template?: boolean
          scheduled_date?: string | null
          scheduled_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          child_id?: string
          name?: string
          category?: string | null
          planned_minutes?: number
          is_active?: boolean
          is_template?: boolean
          scheduled_date?: string | null
          scheduled_time?: string | null
          created_at?: string
        }
      }
      time_records: {
        Row: {
          id: string
          task_id: string
          child_id: string
          parent_id: string
          planned_minutes: number
          actual_minutes: number | null
          saved_minutes: number | null
          status: string
          started_at: string | null
          completed_at: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          child_id: string
          parent_id: string
          planned_minutes: number
          actual_minutes?: number | null
          saved_minutes?: number | null
          status?: string
          started_at?: string | null
          completed_at?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          child_id?: string
          parent_id?: string
          planned_minutes?: number
          actual_minutes?: number | null
          saved_minutes?: number | null
          status?: string
          started_at?: string | null
          completed_at?: string | null
          approved_at?: string | null
          created_at?: string
        }
      }
      time_bank: {
        Row: {
          id: string
          child_id: string
          total_saved_minutes: number
          total_used_minutes: number
          balance_minutes: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          child_id: string
          total_saved_minutes?: number
          total_used_minutes?: number
          balance_minutes?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          total_saved_minutes?: number
          total_used_minutes?: number
          balance_minutes?: number | null
          updated_at?: string
        }
      }
      time_transactions: {
        Row: {
          id: string
          child_id: string
          type: string
          minutes: number
          source: string | null
          record_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          child_id: string
          type: string
          minutes: number
          source?: string | null
          record_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          type?: string
          minutes?: number
          source?: string | null
          record_id?: string | null
          created_at?: string
        }
      }
      store_items: {
        Row: {
          id: string
          parent_id: string
          name: string
          description: string | null
          price_minutes: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          name: string
          description?: string | null
          price_minutes: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          name?: string
          description?: string | null
          price_minutes?: number
          is_active?: boolean
          created_at?: string
        }
      }
      store_item_limits: {
        Row: {
          id: string
          item_id: string
          period: string
          max_count: number
        }
        Insert: {
          id?: string
          item_id: string
          period: string
          max_count: number
        }
        Update: {
          id?: string
          item_id?: string
          period?: string
          max_count?: number
        }
      }
      store_purchases: {
        Row: {
          id: string
          item_id: string
          child_id: string
          price_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          child_id: string
          price_minutes: number
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          child_id?: string
          price_minutes?: number
          created_at?: string
        }
      }
    }
  }
}
