// Generated from the live Supabase schema (project kxrucetarzseicmajwlf) via
// the Supabase MCP `generate_typescript_types`. Regenerate after every
// migration — do not edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          color: string
          created_at: string
          created_by: string
          currency: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          institution: string | null
          kind: string
          metadata: Json
          name: string
          notes: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          color: string
          created_at?: string
          created_by: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          institution?: string | null
          kind: string
          metadata?: Json
          name: string
          notes?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          created_by?: string
          currency?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          institution?: string | null
          kind?: string
          metadata?: Json
          name?: string
          notes?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          metadata: Json
          notes: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_space_id_fkey"
            columns: ["category_id", "space_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          account_id: string
          brand: string | null
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          expires_on: string | null
          id: string
          last4: string | null
          metadata: Json
          name: string
          notes: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          brand?: string | null
          color: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          expires_on?: string | null
          id?: string
          last4?: string | null
          metadata?: Json
          name: string
          notes?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          brand?: string | null
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          expires_on?: string | null
          id?: string
          last4?: string | null
          metadata?: Json
          name?: string
          notes?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_account_id_space_id_fkey"
            columns: ["account_id", "space_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          icon: string
          id: string
          kind: string
          metadata: Json
          name: string
          notes: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          icon: string
          id?: string
          kind: string
          metadata?: Json
          name: string
          notes?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          icon?: string
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          notes?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mortgages: {
        Row: {
          balance: number
          balance_as_of: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          equity_share_pct: number | null
          id: string
          interest_rate: number
          lender: string
          metadata: Json
          monthly_payment: number
          name: string
          notes: string | null
          original_amount: number
          property_value: number | null
          rate_ends_on: string | null
          rate_started_on: string | null
          repayment_type: string
          reversion_rate: number | null
          rate_type: string
          rent_monthly: number | null
          space_id: string
          term_ends_on: string
          updated_at: string
        }
        Insert: {
          balance: number
          balance_as_of?: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          equity_share_pct?: number | null
          id?: string
          interest_rate: number
          lender: string
          metadata?: Json
          monthly_payment: number
          name: string
          notes?: string | null
          original_amount: number
          property_value?: number | null
          rate_ends_on?: string | null
          rate_started_on?: string | null
          repayment_type?: string
          reversion_rate?: number | null
          rate_type: string
          rent_monthly?: number | null
          space_id: string
          term_ends_on: string
          updated_at?: string
        }
        Update: {
          balance?: number
          balance_as_of?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          equity_share_pct?: number | null
          id?: string
          interest_rate?: number
          lender?: string
          metadata?: Json
          monthly_payment?: number
          name?: string
          notes?: string | null
          original_amount?: number
          property_value?: number | null
          rate_ends_on?: string | null
          rate_started_on?: string | null
          repayment_type?: string
          reversion_rate?: number | null
          rate_type?: string
          rent_monthly?: number | null
          space_id?: string
          term_ends_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mortgages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortgages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortgages_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: []
      }
      recurring_payments: {
        Row: {
          account_id: string | null
          amount: number
          anchor_day: number | null
          cadence: string
          category_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          kind: string
          metadata: Json
          name: string
          next_due_on: string
          notes: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          anchor_day?: number | null
          cadence: string
          category_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          kind: string
          metadata?: Json
          name: string
          next_due_on: string
          notes?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          anchor_day?: number | null
          cadence?: string
          category_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          next_due_on?: string
          notes?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_payments_account_id_space_id_fkey"
            columns: ["account_id", "space_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "recurring_payments_category_id_space_id_fkey"
            columns: ["category_id", "space_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "recurring_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_payments_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_payments_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      saving_goals: {
        Row: {
          account_id: string | null
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          metadata: Json
          name: string
          notes: string | null
          saved_amount: number
          space_id: string
          target_amount: number
          target_on: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          color: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          metadata?: Json
          name: string
          notes?: string | null
          saved_amount?: number
          space_id: string
          target_amount: number
          target_on?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          metadata?: Json
          name?: string
          notes?: string | null
          saved_amount?: number
          space_id?: string
          target_amount?: number
          target_on?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saving_goals_account_id_space_id_fkey"
            columns: ["account_id", "space_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "saving_goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saving_goals_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saving_goals_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          space_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          space_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          space_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          created_at: string
          id: string
          role: string
          space_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          space_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          space_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          color: string
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          kind: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          kind?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spaces_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string
          id: string
          kind: string
          metadata: Json
          notes: string | null
          occurred_on: string
          recurring_payment_id: string | null
          space_id: string
          transfer_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          id?: string
          kind: string
          metadata?: Json
          notes?: string | null
          occurred_on?: string
          recurring_payment_id?: string | null
          space_id: string
          transfer_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          id?: string
          kind?: string
          metadata?: Json
          notes?: string | null
          occurred_on?: string
          recurring_payment_id?: string | null
          space_id?: string
          transfer_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_space_id_fkey"
            columns: ["account_id", "space_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "transactions_card_id_account_id_fkey"
            columns: ["card_id", "account_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id", "account_id"]
          },
          {
            foreignKeyName: "transactions_category_id_space_id_fkey"
            columns: ["category_id", "space_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_payment_id_space_id_fkey"
            columns: ["recurring_payment_id", "space_id"]
            isOneToOne: false
            referencedRelation: "recurring_payments"
            referencedColumns: ["id", "space_id"]
          },
          {
            foreignKeyName: "transactions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_account_id_space_id_fkey"
            columns: ["transfer_account_id", "space_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id", "space_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_space_invite: { Args: { invite_id: string }; Returns: undefined }
      apex_transaction_totals: {
        Args: {
          p_account?: string
          p_card?: string
          p_category?: string
          p_from?: string
          p_kind?: string
          p_space_id: string
          p_to?: string
        }
        Returns: {
          expense: number
          income: number
          row_count: number
          transfer_count: number
        }[]
      }
      is_space_member: { Args: { target_space: string }; Returns: boolean }
      mark_recurring_paid: {
        Args: { pay_account?: string; payment_id: string }
        Returns: undefined
      }
      my_pending_invites: {
        Args: never
        Returns: {
          created_at: string
          id: string
          invited_by_name: string
          role: string
          space_color: string
          space_id: string
          space_name: string
        }[]
      }
      seed_default_categories: {
        Args: { target_space: string }
        Returns: undefined
      }
      shares_space_with: { Args: { other_user: string }; Returns: boolean }
      shift_balances: {
        Args: { acct: string; delta: number; txn_kind: string; xfer: string }
        Returns: undefined
      }
      space_role: { Args: { target_space: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
