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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          commission_rate: number
          created_at: string
          credit_balance: number
          id: string
          is_active: boolean
          location: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          credit_balance?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          credit_balance?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_reconciliation: {
        Row: {
          actual_cash_at_hand: number
          created_at: string
          expected_cash: number
          id: string
          logged_by: string | null
          notes: string | null
          recon_date: string
          total_cash_collected: number
          total_credit_issued: number
          total_discounts: number
          total_expenses: number
          total_production_value: number
          updated_at: string
          variance: number
        }
        Insert: {
          actual_cash_at_hand?: number
          created_at?: string
          expected_cash?: number
          id?: string
          logged_by?: string | null
          notes?: string | null
          recon_date?: string
          total_cash_collected?: number
          total_credit_issued?: number
          total_discounts?: number
          total_expenses?: number
          total_production_value?: number
          updated_at?: string
          variance?: number
        }
        Update: {
          actual_cash_at_hand?: number
          created_at?: string
          expected_cash?: number
          id?: string
          logged_by?: string | null
          notes?: string | null
          recon_date?: string
          total_cash_collected?: number
          total_credit_issued?: number
          total_discounts?: number
          total_expenses?: number
          total_production_value?: number
          updated_at?: string
          variance?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          logged_by: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          logged_by?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          logged_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          created_at: string
          daily_wage: number
          id: string
          logged_by: string | null
          meal_deduction: number
          net_pay: number
          notes: string | null
          pay_date: string
          staff_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_wage?: number
          id?: string
          logged_by?: string | null
          meal_deduction?: number
          net_pay?: number
          notes?: string | null
          pay_date?: string
          staff_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_wage?: number
          id?: string
          logged_by?: string | null
          meal_deduction?: number
          net_pay?: number
          notes?: string | null
          pay_date?: string
          staff_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_logs: {
        Row: {
          bags_produced: number
          carry_over_stock: number
          created_at: string
          damages: number
          id: string
          log_date: string
          logged_by: string | null
          notes: string | null
          shift: string
          updated_at: string
        }
        Insert: {
          bags_produced?: number
          carry_over_stock?: number
          created_at?: string
          damages?: number
          id?: string
          log_date?: string
          logged_by?: string | null
          notes?: string | null
          shift: string
          updated_at?: string
        }
        Update: {
          bags_produced?: number
          carry_over_stock?: number
          created_at?: string
          damages?: number
          id?: string
          log_date?: string
          logged_by?: string | null
          notes?: string | null
          shift?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_reports: {
        Row: {
          bakers: number
          bcnt_damaged: number
          bcnt_produced: number
          bcnt_used: number
          brw_damaged: number
          brw_produced: number
          brw_used: number
          created_at: string
          exe_damaged: number
          exe_produced: number
          exe_used: number
          id: string
          mac_damaged: number
          mac_produced: number
          mac_used: number
          management: number
          nat_damaged: number
          nat_produced: number
          nat_used: number
          notes: string | null
          packers: number
          report_date: string
          scnt_damaged: number
          scnt_produced: number
          scnt_used: number
          sup_damaged: number
          sup_produced: number
          sup_used: number
          top_damaged: number
          top_produced: number
          top_used: number
          total_produced: number
          total_staff: number
          total_used: number
          updated_at: string
        }
        Insert: {
          bakers?: number
          bcnt_damaged?: number
          bcnt_produced?: number
          bcnt_used?: number
          brw_damaged?: number
          brw_produced?: number
          brw_used?: number
          created_at?: string
          exe_damaged?: number
          exe_produced?: number
          exe_used?: number
          id?: string
          mac_damaged?: number
          mac_produced?: number
          mac_used?: number
          management?: number
          nat_damaged?: number
          nat_produced?: number
          nat_used?: number
          notes?: string | null
          packers?: number
          report_date?: string
          scnt_damaged?: number
          scnt_produced?: number
          scnt_used?: number
          sup_damaged?: number
          sup_produced?: number
          sup_used?: number
          top_damaged?: number
          top_produced?: number
          top_used?: number
          total_produced?: number
          total_staff?: number
          total_used?: number
          updated_at?: string
        }
        Update: {
          bakers?: number
          bcnt_damaged?: number
          bcnt_produced?: number
          bcnt_used?: number
          brw_damaged?: number
          brw_produced?: number
          brw_used?: number
          created_at?: string
          exe_damaged?: number
          exe_produced?: number
          exe_used?: number
          id?: string
          mac_damaged?: number
          mac_produced?: number
          mac_used?: number
          management?: number
          nat_damaged?: number
          nat_produced?: number
          nat_used?: number
          notes?: string | null
          packers?: number
          report_date?: string
          scnt_damaged?: number
          scnt_produced?: number
          scnt_used?: number
          sup_damaged?: number
          sup_produced?: number
          sup_used?: number
          top_damaged?: number
          top_produced?: number
          top_used?: number
          total_produced?: number
          total_staff?: number
          total_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      raw_materials: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          low_stock_threshold: number
          name: string
          notes: string | null
          quantity_in_stock: number
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name: string
          notes?: string | null
          quantity_in_stock?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          low_stock_threshold?: number
          name?: string
          notes?: string | null
          quantity_in_stock?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          agent_id: string | null
          cash_collected: number
          commission_earned: number
          created_at: string
          credit_amount: number
          damages: number
          discount: number
          gross_amount: number
          id: string
          logged_by: string | null
          notes: string | null
          quantity: number
          returns: number
          sale_date: string
          sale_type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          cash_collected?: number
          commission_earned?: number
          created_at?: string
          credit_amount?: number
          damages?: number
          discount?: number
          gross_amount?: number
          id?: string
          logged_by?: string | null
          notes?: string | null
          quantity?: number
          returns?: number
          sale_date?: string
          sale_type: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          cash_collected?: number
          commission_earned?: number
          created_at?: string
          credit_amount?: number
          damages?: number
          discount?: number
          gross_amount?: number
          id?: string
          logged_by?: string | null
          notes?: string | null
          quantity?: number
          returns?: number
          sale_date?: string
          sale_type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "production_staff" | "sales_clerk"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "production_staff", "sales_clerk"],
    },
  },
} as const
