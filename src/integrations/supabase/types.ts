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
      cash_flow_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          entry_date: string
          id: string
          logged_by: string | null
          notes: string | null
          reference: string | null
          source_or_destination: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          logged_by?: string | null
          notes?: string | null
          reference?: string | null
          source_or_destination?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          logged_by?: string | null
          notes?: string | null
          reference?: string | null
          source_or_destination?: string | null
          type?: string
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
      finished_goods_stock: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number
          notes: string | null
          product_type_id: string
          quantity_in_stock: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          notes?: string | null
          product_type_id: string
          quantity_in_stock?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number
          notes?: string | null
          product_type_id?: string
          quantity_in_stock?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finished_goods_stock_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_usage_logs: {
        Row: {
          created_at: string
          flour_bags: number
          flour_measure_g: number
          flour_used_g: number
          id: string
          log_date: string
          notes: string | null
          preservatives_measure_g: number
          preservatives_used_g: number
          product_type_id: string
          salt_measure_g: number
          salt_used_g: number
          sugar_measure_g: number
          sugar_used_g: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          flour_bags?: number
          flour_measure_g?: number
          flour_used_g?: number
          id?: string
          log_date?: string
          notes?: string | null
          preservatives_measure_g?: number
          preservatives_used_g?: number
          product_type_id: string
          salt_measure_g?: number
          salt_used_g?: number
          sugar_measure_g?: number
          sugar_used_g?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          flour_bags?: number
          flour_measure_g?: number
          flour_used_g?: number
          id?: string
          log_date?: string
          notes?: string | null
          preservatives_measure_g?: number
          preservatives_used_g?: number
          product_type_id?: string
          salt_measure_g?: number
          salt_used_g?: number
          sugar_measure_g?: number
          sugar_used_g?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_usage_logs_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
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
      printing_jobs: {
        Row: {
          cost: number
          created_at: string
          description: string
          id: string
          item_type: string
          job_date: string
          logged_by: string | null
          notes: string | null
          quantity: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          description: string
          id?: string
          item_type?: string
          job_date?: string
          logged_by?: string | null
          notes?: string | null
          quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          description?: string
          id?: string
          item_type?: string
          job_date?: string
          logged_by?: string | null
          notes?: string | null
          quantity?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      proforma_orders: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string | null
          delivery_date: string | null
          id: string
          logged_by: string | null
          notes: string | null
          order_date: string
          product_type_id: string | null
          quantity: number
          status: string
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          delivery_date?: string | null
          id?: string
          logged_by?: string | null
          notes?: string | null
          order_date?: string
          product_type_id?: string | null
          quantity?: number
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          delivery_date?: string | null
          id?: string
          logged_by?: string | null
          notes?: string | null
          order_date?: string
          product_type_id?: string | null
          quantity?: number
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proforma_orders_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
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
