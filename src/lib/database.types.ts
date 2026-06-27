export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      subscriptions: TableDefinition<
        {
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
          category: string
          favorite: boolean
          auto_renew: boolean
          currency: string
          created_at: string
          updated_at: string
        },
        {
          id?: string
          user_id: string
          name: string
          url?: string
          icon?: string
          monthly_cost: number
          billing_period?: string
          payment_method?: string
          usage_state?: string
          start_date?: string
          category?: string
          favorite?: boolean
          auto_renew?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
        }
      >
      subscription_price_history: TableDefinition<
        {
          id: string
          subscription_id: string
          user_id: string
          monthly_cost: number
          currency: string
          effective_from: string
          is_correction: boolean
          created_at: string
        },
        {
          id?: string
          subscription_id: string
          user_id: string
          monthly_cost: number
          currency?: string
          effective_from?: string
          is_correction?: boolean
          created_at?: string
        }
      >
      currency_preferences: TableDefinition<
        {
          id: string
          user_id: string
          display_currency: string
          exchange_rates: Json
          last_updated: string
          created_at: string
          updated_at: string
        },
        {
          id?: string
          user_id: string
          display_currency?: string
          exchange_rates?: Json
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      >
      dashboard_layouts: TableDefinition<
        {
          id: string
          user_id: string
          layout: string[]
          created_at: string
          updated_at: string
        },
        {
          id?: string
          user_id: string
          layout: string[]
          created_at?: string
          updated_at?: string
        }
      >
      financial_assets: TableDefinition<
        {
          id: string
          user_id: string
          name: string
          type: string
          value: number
          quantity: number | null
          purchase_price: number | null
          purchase_date: string | null
          current_price: number | null
          notes: string | null
          created_at: string
          updated_at: string | null
        },
        {
          id?: string
          user_id: string
          name: string
          type: string
          value: number
          quantity?: number | null
          purchase_price?: number | null
          purchase_date?: string | null
          current_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
      >
      asset_transactions: TableDefinition<
        {
          id: string
          user_id: string
          asset_id: string
          type: 'buy' | 'sell' | 'dividend' | 'other'
          quantity: number
          price: number
          date: string
          fees: number | null
          notes: string | null
          created_at: string
        },
        {
          id?: string
          user_id: string
          asset_id: string
          type: 'buy' | 'sell' | 'dividend' | 'other'
          quantity: number
          price: number
          date: string
          fees?: number | null
          notes?: string | null
          created_at?: string
        }
      >
      fixed_expenses: TableDefinition<
        {
          id: string
          user_id: string
          name: string
          amount: number
          category: string
          due_date: string | null
          dueDate?: string | null
          frequency: 'monthly' | 'quarterly' | 'yearly'
          autopay: boolean
          notes: string | null
          created_at: string
        },
        {
          id?: string
          user_id: string
          name: string
          amount: number
          category: string
          due_date?: string | null
          dueDate?: string | null
          frequency: 'monthly' | 'quarterly' | 'yearly'
          autopay?: boolean
          notes?: string | null
          created_at?: string
        }
      >
      variable_expenses: TableDefinition<
        {
          id: string
          user_id: string
          name: string
          amount: number
          category: string
          date: string
          notes: string | null
          created_at: string
        },
        {
          id?: string
          user_id: string
          name: string
          amount: number
          category: string
          date: string
          notes?: string | null
          created_at?: string
        }
      >
      income_sources: TableDefinition<
        {
          id: string
          user_id: string
          name?: string
          source: string
          amount: number
          frequency: 'weekly' | 'monthly' | 'yearly' | 'one_time'
          next_payment: string | null
          nextPayment?: string
          notes: string | null
          created_at: string
        },
        {
          id?: string
          user_id: string
          name?: string
          source: string
          amount: number
          frequency: 'weekly' | 'monthly' | 'yearly' | 'one_time'
          next_payment?: string | null
          nextPayment?: string
          notes?: string | null
          created_at?: string
        }
      >
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_update_subscription_order: {
        Args: { updates: Json }
        Returns: void
      }
      delete_subscription_directly: {
        Args: { sub_id: string }
        Returns: void
      }
      get_user_categories: {
        Args: Record<string, never>
        Returns: { category: string; subscription_count: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
