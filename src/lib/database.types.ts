export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          name: string
          url: string
          icon: string
          monthly_cost: number
          billing_period: string
          payment_method: string
          usage_state: string
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          url: string
          icon: string
          monthly_cost: number
          billing_period: string
          payment_method: string
          usage_state: string
          start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          url?: string
          icon?: string
          monthly_cost?: number
          billing_period?: string
          payment_method?: string
          usage_state?: string
          start_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      dashboard_layouts: {
        Row: {
          id: string
          user_id: string
          layout: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          layout: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          layout?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}