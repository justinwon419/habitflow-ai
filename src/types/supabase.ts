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
      habit_completions: {
        Row: {
          created_at: string | null
          date: string
          habit_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          habit_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          habit_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          goal_title:string
          timeline: string
          description: string
          motivator: string
          future_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          goal_title:string
          timeline: string
          description: string
          motivator: string
          future_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          goal_title:string
          timeline?: string
          description?: string
          motivator?: string
          future_message?: string | null
        }
        Relationships: []
      }
      weekly_difficulty_overrides: {
        Row: {
          id: string
          user_id: string
          week_start: string // or Date if you prefer
          override: 'easier' | 'same' | 'harder'
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          override: 'easier' | 'same' | 'harder'
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          override?: 'easier' | 'same' | 'harder'
          created_at?: string | null
        }
        Relationships: []
      }
      weekly_stats: {
        Row: {
          id: string
          user_id: string
          week_start: string // ISO string
          completion_pct: number
          streak_count: number | null // optional if you're not using it yet
          difficulty: string // e.g. "easier" | "same" | "harder"
          summary: string
          created_at: string
        }
        Insert: {
          user_id: string
          week_start: string
          completion_pct: number
          streak_count?: number | null
          difficulty: string
          summary: string
          created_at?: string
        }
        Update: Partial<{
          user_id: string
          week_start: string
          completion_pct: number
          streak_count: number | null
          difficulty: string
          summary: string
          created_at: string
        }>
        Relationships: []
      }
      user_goal_streak: {
        Row: {
          /** Primary key */
          id: string
          /** References auth.users(id) */
          user_id: string
          /** Number of consecutive days ≥80% completion */
          current_streak: number
          /** Date this streak was last checked (YYYY-MM-DD) */
          last_checked: string
          /** When this record was first created */
          created_at: string | null
          /** When this record was last updated */
          updated_at: string | null
        }
        Insert: {
          /** You can let the DB default this */
          id?: string
          user_id: string
          current_streak?: number
          last_checked?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          last_checked?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
