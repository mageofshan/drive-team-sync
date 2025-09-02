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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          status: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          status: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      carpool_riders: {
        Row: {
          carpool_id: string
          created_at: string
          id: string
          notes: string | null
          pickup_location: string | null
          rider_id: string
        }
        Insert: {
          carpool_id: string
          created_at?: string
          id?: string
          notes?: string | null
          pickup_location?: string | null
          rider_id: string
        }
        Update: {
          carpool_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          pickup_location?: string | null
          rider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpool_riders_carpool_id_fkey"
            columns: ["carpool_id"]
            isOneToOne: false
            referencedRelation: "carpools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_carpool_riders_rider_profiles"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      carpools: {
        Row: {
          available_seats: number
          created_at: string
          departure_location: string
          departure_time: string
          driver_id: string
          event_id: string
          id: string
          notes: string | null
          return_time: string | null
          updated_at: string
        }
        Insert: {
          available_seats?: number
          created_at?: string
          departure_location: string
          departure_time: string
          driver_id: string
          event_id: string
          id?: string
          notes?: string | null
          return_time?: string | null
          updated_at?: string
        }
        Update: {
          available_seats?: number
          created_at?: string
          departure_location?: string
          departure_time?: string
          driver_id?: string
          event_id?: string
          id?: string
          notes?: string | null
          return_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carpools_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_carpools_driver_profiles"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_rsvps_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_recurring: boolean | null
          location: string | null
          max_attendees: number | null
          recurrence_pattern: Json | null
          start_time: string
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          max_attendees?: number | null
          recurrence_pattern?: Json | null
          start_time: string
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          max_attendees?: number | null
          recurrence_pattern?: Json | null
          start_time?: string
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_created_by_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      finances: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string
          date: string
          description: string
          expense_category:
            | Database["public"]["Enums"]["expense_category"]
            | null
          id: string
          income_source: Database["public"]["Enums"]["income_source"] | null
          receipt_url: string | null
          team_id: string
          type: Database["public"]["Enums"]["finance_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by: string
          date?: string
          description: string
          expense_category?:
            | Database["public"]["Enums"]["expense_category"]
            | null
          id?: string
          income_source?: Database["public"]["Enums"]["income_source"] | null
          receipt_url?: string | null
          team_id: string
          type: Database["public"]["Enums"]["finance_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          expense_category?:
            | Database["public"]["Enums"]["expense_category"]
            | null
          id?: string
          income_source?: Database["public"]["Enums"]["income_source"] | null
          receipt_url?: string | null
          team_id?: string
          type?: Database["public"]["Enums"]["finance_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finances_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_finances_created_by_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string
          id: string
          mentioned_category: string | null
          mentioned_user_id: string | null
          message_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentioned_category?: string | null
          mentioned_user_id?: string | null
          message_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentioned_category?: string | null
          mentioned_user_id?: string | null
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mentions_mentioned_user_profiles"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          carpool_id: string | null
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_pinned: boolean | null
          message_type: Database["public"]["Enums"]["message_type"]
          resource_category:
            | Database["public"]["Enums"]["resource_category"]
            | null
          task_id: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carpool_id?: string | null
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"]
          resource_category?:
            | Database["public"]["Enums"]["resource_category"]
            | null
          task_id?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carpool_id?: string | null
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: Database["public"]["Enums"]["message_type"]
          resource_category?:
            | Database["public"]["Enums"]["resource_category"]
            | null
          task_id?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_user_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dietary_restrictions: string | null
          email: string | null
          emergency_contact: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          email?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_assigned_to_profiles"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_tasks_created_by_profiles"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          team_number: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
          team_number?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          team_number?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_team_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      event_type: "meeting" | "practice" | "outreach" | "competition" | "other"
      expense_category:
        | "parts"
        | "travel"
        | "hotel"
        | "food"
        | "registration"
        | "tools"
        | "other"
      finance_type: "income" | "expense"
      income_source:
        | "grant"
        | "donation"
        | "sponsorship"
        | "fundraising"
        | "other"
      message_type: "chat" | "task" | "carpool" | "resource"
      resource_category:
        | "cad"
        | "code"
        | "mechanical"
        | "electrical"
        | "general"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "done"
      user_role:
        | "admin"
        | "code_lead"
        | "mechanical_lead"
        | "electrical_lead"
        | "drive_coach"
        | "student_mentor"
        | "student"
        | "mentor"
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
      event_type: ["meeting", "practice", "outreach", "competition", "other"],
      expense_category: [
        "parts",
        "travel",
        "hotel",
        "food",
        "registration",
        "tools",
        "other",
      ],
      finance_type: ["income", "expense"],
      income_source: [
        "grant",
        "donation",
        "sponsorship",
        "fundraising",
        "other",
      ],
      message_type: ["chat", "task", "carpool", "resource"],
      resource_category: ["cad", "code", "mechanical", "electrical", "general"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "review", "done"],
      user_role: [
        "admin",
        "code_lead",
        "mechanical_lead",
        "electrical_lead",
        "drive_coach",
        "student_mentor",
        "student",
        "mentor",
      ],
    },
  },
} as const
