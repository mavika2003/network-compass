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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      connections: {
        Row: {
          contact_a_id: string
          contact_b_id: string
          created_at: string | null
          id: string
          relationship_type: string | null
          user_id: string
        }
        Insert: {
          contact_a_id: string
          contact_b_id: string
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          user_id: string
        }
        Update: {
          contact_a_id?: string
          contact_b_id?: string
          created_at?: string | null
          id?: string
          relationship_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_contact_a_id_fkey"
            columns: ["contact_a_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_contact_b_id_fkey"
            columns: ["contact_b_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          category_tags: string[] | null
          company: string | null
          created_at: string | null
          description: string | null
          email: string | null
          gender: string | null
          id: string
          job_title: string | null
          last_contacted_at: string | null
          location: string | null
          name: string
          node_position_x: number | null
          node_position_y: number | null
          notes: string | null
          phone: string | null
          relationship_strength: number | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          category_tags?: string[] | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          location?: string | null
          name: string
          node_position_x?: number | null
          node_position_y?: number | null
          notes?: string | null
          phone?: string | null
          relationship_strength?: number | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          category_tags?: string[] | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          location?: string | null
          name?: string
          node_position_x?: number | null
          node_position_y?: number | null
          notes?: string | null
          phone?: string | null
          relationship_strength?: number | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      interaction_log: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          interaction_type: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interaction_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          location: string | null
          post_type: string | null
          user_id: string
          visibility_tags: string[] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          post_type?: string | null
          user_id: string
          visibility_tags?: string[] | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          post_type?: string | null
          user_id?: string
          visibility_tags?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          job_title: string | null
          location: string | null
          name: string | null
          onboarding_completed: boolean | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          job_title?: string | null
          location?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean | null
          contact_id: string | null
          created_at: string | null
          due_at: string | null
          id: string
          message: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          message?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_tags: {
        Row: {
          created_at: string
          id: string
          owner_id: string
          shared_with_id: string
          tag_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id: string
          shared_with_id: string
          tag_name: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string
          shared_with_id?: string
          tag_name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          ai_generated: boolean | null
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          responder_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          responder_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          responder_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shared_contacts: {
        Args: { owner_id: string; viewer_id: string }
        Returns: {
          avatar_url: string
          category_tags: string[]
          company: string
          email: string
          id: string
          job_title: string
          location: string
          name: string
        }[]
      }
      get_visible_posts: {
        Args: { viewer_id: string }
        Returns: {
          author_avatar: string
          author_name: string
          content: string
          created_at: string
          expires_at: string
          id: string
          image_url: string
          location: string
          post_type: string
          user_id: string
          visibility_tags: string[]
        }[]
      }
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
