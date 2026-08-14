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
      agent_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          label: string
          last_used: string | null
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          label: string
          last_used?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          label?: string
          last_used?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          from_email: string
          from_name: string
          id: string
          organization_id: string
          payment_reminders_enabled: boolean
          paypal_link: string
          reminder_after_days: number
          signature: string
          tag_rules: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          organization_id: string
          payment_reminders_enabled?: boolean
          paypal_link?: string
          reminder_after_days?: number
          signature?: string
          tag_rules?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          organization_id?: string
          payment_reminders_enabled?: boolean
          paypal_link?: string
          reminder_after_days?: number
          signature?: string
          tag_rules?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          email_id: string
          from_email: string
          from_name: string
          id: string
          organization_id: string | null
          sent_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction?: string
          email_id: string
          from_email: string
          from_name: string
          id?: string
          organization_id?: string | null
          sent_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          email_id?: string
          from_email?: string
          from_name?: string
          id?: string
          organization_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body: string | null
          created_at: string
          draft_html: string | null
          external_id: string | null
          id: string
          kind: string | null
          organization_id: string | null
          received_at: string
          sender_email: string
          sender_name: string
          snippet: string | null
          sources: string[] | null
          status: string
          subject: string
          unread: boolean
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          draft_html?: string | null
          external_id?: string | null
          id?: string
          kind?: string | null
          organization_id?: string | null
          received_at?: string
          sender_email: string
          sender_name: string
          snippet?: string | null
          sources?: string[] | null
          status?: string
          subject: string
          unread?: boolean
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          draft_html?: string | null
          external_id?: string | null
          id?: string
          kind?: string | null
          organization_id?: string | null
          received_at?: string
          sender_email?: string
          sender_name?: string
          snippet?: string | null
          sources?: string[] | null
          status?: string
          subject?: string
          unread?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      historical_emails: {
        Row: {
          body_chunk: string
          created_at: string
          embedding: string | null
          id: string
          included: boolean
          organization_id: string | null
          sent_at: string | null
          source_account: string
          thread_subject: string
          updated_at: string
        }
        Insert: {
          body_chunk: string
          created_at?: string
          embedding?: string | null
          id?: string
          included?: boolean
          organization_id?: string | null
          sent_at?: string | null
          source_account: string
          thread_subject: string
          updated_at?: string
        }
        Update: {
          body_chunk?: string
          created_at?: string
          embedding?: string | null
          id?: string
          included?: boolean
          organization_id?: string | null
          sent_at?: string | null
          source_account?: string
          thread_subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          organization_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          organization_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          organization_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mailbox_connections: {
        Row: {
          auth_token: string | null
          created_at: string
          endpoint_url: string | null
          id: string
          imap_host: string | null
          imap_port: string | null
          is_active: boolean
          organization_id: string | null
          password: string | null
          provider_mode: string
          provider_name: string | null
          smtp_host: string | null
          smtp_port: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          auth_token?: string | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          imap_host?: string | null
          imap_port?: string | null
          is_active?: boolean
          organization_id?: string | null
          password?: string | null
          provider_mode?: string
          provider_name?: string | null
          smtp_host?: string | null
          smtp_port?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          auth_token?: string | null
          created_at?: string
          endpoint_url?: string | null
          id?: string
          imap_host?: string | null
          imap_port?: string | null
          is_active?: boolean
          organization_id?: string | null
          password?: string | null
          provider_mode?: string
          provider_name?: string | null
          smtp_host?: string | null
          smtp_port?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      organizations: {
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
      subscriptions: {
        Row: {
          amount: number
          billing_period: string
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          id: string
          last_reminder_sent_at: string | null
          notes: string | null
          organization_id: string
          plan_name: string
          reminder_count: number
          renewal_date: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          billing_period?: string
          created_at?: string
          currency?: string
          customer_email: string
          customer_name?: string
          id?: string
          last_reminder_sent_at?: string | null
          notes?: string | null
          organization_id?: string
          plan_name?: string
          reminder_count?: number
          renewal_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_period?: string
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          id?: string
          last_reminder_sent_at?: string | null
          notes?: string | null
          organization_id?: string
          plan_name?: string
          reminder_count?: number
          renewal_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_profiles: {
        Row: {
          avg_length: string | null
          created_at: string
          greeting: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          phrases: string[] | null
          signoff: string | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          avg_length?: string | null
          created_at?: string
          greeting?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phrases?: string[] | null
          signoff?: string | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          avg_length?: string | null
          created_at?: string
          greeting?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phrases?: string[] | null
          signoff?: string | null
          tone?: string | null
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
