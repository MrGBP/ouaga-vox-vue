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
      blocked_dates: {
        Row: {
          created_at: string
          date_from: string
          date_to: string
          id: string
          note: string | null
          owner_id: string
          property_id: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_from: string
          date_to: string
          id?: string
          note?: string | null
          owner_id: string
          property_id: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_from?: string
          date_to?: string
          id?: string
          note?: string | null
          owner_id?: string
          property_id?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      country_configs: {
        Row: {
          code: string
          commission_rate: number
          created_at: string
          currency: string
          currency_symbol: string
          enabled: boolean
          flag_emoji: string
          id: string
          language: string
          name: string
          support_email: string | null
          support_whatsapp: string | null
          updated_at: string
        }
        Insert: {
          code: string
          commission_rate?: number
          created_at?: string
          currency?: string
          currency_symbol?: string
          enabled?: boolean
          flag_emoji?: string
          id?: string
          language?: string
          name: string
          support_email?: string | null
          support_whatsapp?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          commission_rate?: number
          created_at?: string
          currency?: string
          currency_symbol?: string
          enabled?: boolean
          flag_emoji?: string
          id?: string
          language?: string
          name?: string
          support_email?: string | null
          support_whatsapp?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_property_types: {
        Row: {
          admin_note: string | null
          approved_key: string | null
          created_at: string
          description: string | null
          id: string
          label: string
          status: string
          suggested_by: string | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          approved_key?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label: string
          status?: string
          suggested_by?: string | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          approved_key?: string | null
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          status?: string
          suggested_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      locations: {
        Row: {
          active: boolean
          arrondissement: number | null
          city: string
          commune: string | null
          country_code: string
          country_name: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          quartier: string
        }
        Insert: {
          active?: boolean
          arrondissement?: number | null
          city: string
          commune?: string | null
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          quartier: string
        }
        Update: {
          active?: boolean
          arrondissement?: number | null
          city?: string
          commune?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          quartier?: string
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
          reply_to_id: string | null
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
          reply_to_id?: string | null
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
          reply_to_id?: string | null
          reservation_id?: string | null
          sender_id?: string | null
          sender_name?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
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
          city: string | null
          comfort_rating: number | null
          correction_round: number
          country_code: string
          created_at: string
          description: string | null
          favorite_count: number
          features: Json
          furnished: boolean | null
          id: string
          images: string[] | null
          is_official: boolean
          last_correction_at: string | null
          last_correction_note: string | null
          latitude: number
          longitude: number
          owner_id: string | null
          owner_updated_at: string | null
          price: number
          published_at: string | null
          quartier: string
          reviewed_at: string | null
          reviewed_by: string | null
          security_rating: number | null
          status: string | null
          surface_area: number | null
          title: string
          type: string
          updated_at: string
          video_url: string | null
          view_count: number
          virtual_tour_url: string | null
          whatsapp_phone: string | null
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
          city?: string | null
          comfort_rating?: number | null
          correction_round?: number
          country_code?: string
          created_at?: string
          description?: string | null
          favorite_count?: number
          features?: Json
          furnished?: boolean | null
          id?: string
          images?: string[] | null
          is_official?: boolean
          last_correction_at?: string | null
          last_correction_note?: string | null
          latitude: number
          longitude: number
          owner_id?: string | null
          owner_updated_at?: string | null
          price: number
          published_at?: string | null
          quartier: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_rating?: number | null
          status?: string | null
          surface_area?: number | null
          title: string
          type: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
          virtual_tour_url?: string | null
          whatsapp_phone?: string | null
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
          city?: string | null
          comfort_rating?: number | null
          correction_round?: number
          country_code?: string
          created_at?: string
          description?: string | null
          favorite_count?: number
          features?: Json
          furnished?: boolean | null
          id?: string
          images?: string[] | null
          is_official?: boolean
          last_correction_at?: string | null
          last_correction_note?: string | null
          latitude?: number
          longitude?: number
          owner_id?: string | null
          owner_updated_at?: string | null
          price?: number
          published_at?: string | null
          quartier?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          security_rating?: number | null
          status?: string | null
          surface_area?: number | null
          title?: string
          type?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number
          virtual_tour_url?: string | null
          whatsapp_phone?: string | null
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
      public_reservations: {
        Row: {
          check_in: string
          check_out: string
          confirmation_number: string
          created_at: string
          guests_count: number
          id: string
          message: string | null
          nights: number
          price_per_night: number
          property_id: string
          property_quartier: string
          property_title: string
          status: string
          total_price: number
          user_email: string
          user_name: string
          user_phone: string
        }
        Insert: {
          check_in: string
          check_out: string
          confirmation_number?: string
          created_at?: string
          guests_count?: number
          id?: string
          message?: string | null
          nights: number
          price_per_night: number
          property_id: string
          property_quartier: string
          property_title: string
          status?: string
          total_price: number
          user_email: string
          user_name: string
          user_phone: string
        }
        Update: {
          check_in?: string
          check_out?: string
          confirmation_number?: string
          created_at?: string
          guests_count?: number
          id?: string
          message?: string | null
          nights?: number
          price_per_night?: number
          property_id?: string
          property_quartier?: string
          property_title?: string
          status?: string
          total_price?: number
          user_email?: string
          user_name?: string
          user_phone?: string
        }
        Relationships: []
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
          confirmation_number: string | null
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
          confirmation_number?: string | null
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
          confirmation_number?: string | null
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
      activate_owner_role: { Args: never; Returns: undefined }
      ensure_user_profile: {
        Args: { _full_name?: string; _phone?: string }
        Returns: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_country_support: {
        Args: { _code: string }
        Returns: {
          support_email: string
          support_whatsapp: string
        }[]
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_reserved_dates: {
        Args: { _property_id: string }
        Returns: {
          check_in: string
          check_out: string
        }[]
      }
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
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
      is_property_owner: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      list_country_configs_public: {
        Args: never
        Returns: {
          code: string
          commission_rate: number
          currency: string
          currency_symbol: string
          enabled: boolean
          flag_emoji: string
          id: string
          language: string
          name: string
        }[]
      }
      sync_property_images_from_media: {
        Args: { _property_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "owner" | "admin_readonly"
      media_kind: "image" | "video" | "video_360"
      property_admin_status:
        | "pending"
        | "reviewing"
        | "corrections"
        | "published"
        | "rented"
        | "inactive"
        | "rejected"
        | "paused"
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
      app_role: ["admin", "user", "owner", "admin_readonly"],
      media_kind: ["image", "video", "video_360"],
      property_admin_status: [
        "pending",
        "reviewing",
        "corrections",
        "published",
        "rented",
        "inactive",
        "rejected",
        "paused",
      ],
      reservation_kind: ["visit", "booking", "rental_request"],
      reservation_status: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
} as const
