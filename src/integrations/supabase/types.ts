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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          property_id: string | null
          read_by_admin: boolean
          read_by_client: boolean
          reservation_id: string | null
          sender_id: string | null
          sender_name: string
          sender_role: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          property_id?: string | null
          read_by_admin?: boolean
          read_by_client?: boolean
          reservation_id?: string | null
          sender_id?: string | null
          sender_name: string
          sender_role?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          property_id?: string | null
          read_by_admin?: boolean
          read_by_client?: boolean
          reservation_id?: string | null
          sender_id?: string | null
          sender_name?: string
          sender_role?: string
        }
        Relationships: []
      }
      pois: {
        Row: {
          created_at: string
          distance_m: number | null
          id: string
          latitude: number
          longitude: number
          name: string
          property_id: string | null
          quartier: string
          type: string
        }
        Insert: {
          created_at?: string
          distance_m?: number | null
          id?: string
          latitude: number
          longitude: number
          name: string
          property_id?: string | null
          quartier: string
          type: string
        }
        Update: {
          created_at?: string
          distance_m?: number | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          property_id?: string | null
          quartier?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pois_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          accessibility_rating: number | null
          address: string
          admin_status: Database["public"]["Enums"]["property_admin_status"]
          agent_name: string | null
          agent_phone: string | null
          agent_photo: string | null
          available: boolean | null
          bathrooms: number | null
          bedrooms: number | null
          comfort_rating: number | null
          created_at: string
          description: string | null
          favorite_count: number
          features: Json
          furnished: boolean | null
          id: string
          images: string[] | null
          latitude: number
          longitude: number
          owner_id: string | null
          price: number
          published_at: string | null
          quartier: string
          security_rating: number | null
          status: string | null
          surface_area: number | null
          title: string
          type: string
          updated_at: string
          video_url: string | null
          view_count: number
          virtual_tour_url: string | null
          year_built: number | null
        }
        Insert: {
          accessibility_rating?: number | null
          address: string
          admin_status?: Database["public"]["Enums"]["property_admin_status"]
          agent_name?: string | null
          agent_phone?: string | null
          agent_photo?: string | null
          available?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          comfort_rating?: number | null
          created_at?: string
          description?: string | null
          favorite_count?: number
          features?: Json
          furnished?: boolean | null
          id?: string
          images?: string[] | null
          latitude: number
          longitude: number
          owner_id?: string | null
          price: number
          published_at?: string | null
          quartier: string
          security_rating?: number | null
          status?: string | null
          surface_area?: number | null
          title: string
          type: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
          virtual_tour_url?: string | null
          year_built?: number | null
        }
        Update: {
          accessibility_rating?: number | null
          address?: string
          admin_status?: Database["public"]["Enums"]["property_admin_status"]
          agent_name?: string | null
          agent_phone?: string | null
          agent_photo?: string | null
          available?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          comfort_rating?: number | null
          created_at?: string
          description?: string | null
          favorite_count?: number
          features?: Json
          furnished?: boolean | null
          id?: string
          images?: string[] | null
          latitude?: number
          longitude?: number
          owner_id?: string | null
          price?: number
          published_at?: string | null
          quartier?: string
          security_rating?: number | null
          status?: string | null
          surface_area?: number | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
          virtual_tour_url?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      property_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          position: number
          property_id: string
          storage_path: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          position?: number
          property_id: string
          storage_path?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          position?: number
          property_id?: string
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      quartiers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          name?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          admin_notes: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string
          created_at: string
          end_date: string | null
          guests_count: number
          id: string
          kind: Database["public"]["Enums"]["reservation_kind"]
          message: string | null
          property_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          total_price: number | null
          updated_at: string
          user_id: string | null
          visit_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone: string
          created_at?: string
          end_date?: string | null
          guests_count?: number
          id?: string
          kind?: Database["public"]["Enums"]["reservation_kind"]
          message?: string | null
          property_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
          visit_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string
          created_at?: string
          end_date?: string | null
          guests_count?: number
          id?: string
          kind?: Database["public"]["Enums"]["reservation_kind"]
          message?: string | null
          property_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_price?: number | null
          updated_at?: string
          user_id?: string | null
          visit_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alert_enabled: boolean
          created_at: string
          filters: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          filters?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      increment_property_view: {
        Args: { _property_id: string }
        Returns: undefined
      }
      is_property_owner: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "owner"
      media_kind: "image" | "video" | "video_360"
      property_admin_status:
        | "pending"
        | "reviewing"
        | "corrections"
        | "published"
        | "rented"
        | "inactive"
        | "rejected"
      reservation_kind: "visit" | "booking" | "rental_request"
      reservation_status: "pending" | "confirmed" | "completed" | "cancelled"
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
      app_role: ["admin", "user", "owner"],
      media_kind: ["image", "video", "video_360"],
      property_admin_status: [
        "pending",
        "reviewing",
        "corrections",
        "published",
        "rented",
        "inactive",
        "rejected",
      ],
      reservation_kind: ["visit", "booking", "rental_request"],
      reservation_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
