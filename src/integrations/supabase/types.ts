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
      addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          landmark: string | null
          latitude: number | null
          line1: string
          line2: string | null
          longitude: number | null
          phone: string
          pincode: string
          recipient_name: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          latitude?: number | null
          line1: string
          line2?: string | null
          longitude?: number | null
          phone: string
          pincode: string
          recipient_name: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          latitude?: number | null
          line1?: string
          line2?: string | null
          longitude?: number | null
          phone?: string
          pincode?: string
          recipient_name?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      astro_chat_messages: {
        Row: {
          ciphertext: string
          created_at: string
          id: string
          iv: string
          sender: string
          session_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          id?: string
          iv: string
          sender: string
          session_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          id?: string
          iv?: string
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "astro_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "astro_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      astro_chat_sessions: {
        Row: {
          astrologer_id: string
          astrologer_name: string
          billed_amount: number
          created_at: string
          encryption_salt: string
          ended_at: string | null
          id: string
          price_per_min: number
          seconds_elapsed: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          astrologer_id: string
          astrologer_name: string
          billed_amount?: number
          created_at?: string
          encryption_salt: string
          ended_at?: string | null
          id?: string
          price_per_min?: number
          seconds_elapsed?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          astrologer_id?: string
          astrologer_name?: string
          billed_amount?: number
          created_at?: string
          encryption_salt?: string
          ended_at?: string | null
          id?: string
          price_per_min?: number
          seconds_elapsed?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credits_ledger: {
        Row: {
          amount_paise: number
          created_at: string
          description: string | null
          id: string
          kind: string
          metadata: Json
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          metadata?: Json
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      festivals: {
        Row: {
          created_at: string
          festival_date: string
          id: string
          name: string
          note: string
          pooja_label: string | null
          pooja_slug: string | null
          type: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          festival_date: string
          id?: string
          name: string
          note?: string
          pooja_label?: string | null
          pooja_slug?: string | null
          type: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          festival_date?: string
          id?: string
          name?: string
          note?: string
          pooja_label?: string | null
          pooja_slug?: string | null
          type?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          line_total: number
          name: string
          order_id: string
          qty: number
          samagri_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          line_total: number
          name: string
          order_id: string
          qty: number
          samagri_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          line_total?: number
          name?: string
          order_id?: string
          qty?: number
          samagri_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_label: string | null
          city: string
          created_at: string
          credits_applied: number
          id: string
          landmark: string | null
          line1: string
          line2: string | null
          muhurat: string | null
          notes: string | null
          pandit_id: string | null
          pandit_name: string | null
          pandit_ref: string | null
          payment_method: string
          payment_status: string
          phone: string
          pincode: string
          pooja_name: string | null
          pooja_slug: string | null
          recipient_name: string
          scheduled_at: string | null
          shipping: number
          state: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_label?: string | null
          city: string
          created_at?: string
          credits_applied?: number
          id?: string
          landmark?: string | null
          line1: string
          line2?: string | null
          muhurat?: string | null
          notes?: string | null
          pandit_id?: string | null
          pandit_name?: string | null
          pandit_ref?: string | null
          payment_method?: string
          payment_status?: string
          phone: string
          pincode: string
          pooja_name?: string | null
          pooja_slug?: string | null
          recipient_name: string
          scheduled_at?: string | null
          shipping?: number
          state: string
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_label?: string | null
          city?: string
          created_at?: string
          credits_applied?: number
          id?: string
          landmark?: string | null
          line1?: string
          line2?: string | null
          muhurat?: string | null
          notes?: string | null
          pandit_id?: string | null
          pandit_name?: string | null
          pandit_ref?: string | null
          payment_method?: string
          payment_status?: string
          phone?: string
          pincode?: string
          pooja_name?: string | null
          pooja_slug?: string | null
          recipient_name?: string
          scheduled_at?: string | null
          shipping?: number
          state?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
        ]
      }
      pandit_applications: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          city: string
          created_at: string
          experience: number
          full_name: string
          id: string
          ifsc: string | null
          languages: string
          message: string | null
          phone: string
          specialties: string
          status: string
          updated_at: string
          upi_id: string | null
          user_id: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          city?: string
          created_at?: string
          experience?: number
          full_name: string
          id?: string
          ifsc?: string | null
          languages?: string
          message?: string | null
          phone: string
          specialties?: string
          status?: string
          updated_at?: string
          upi_id?: string | null
          user_id?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          city?: string
          created_at?: string
          experience?: number
          full_name?: string
          id?: string
          ifsc?: string | null
          languages?: string
          message?: string | null
          phone?: string
          specialties?: string
          status?: string
          updated_at?: string
          upi_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pandit_payouts: {
        Row: {
          amount_paise: number
          created_at: string
          id: string
          method: string
          notes: string | null
          order_id: string | null
          paid_at: string | null
          pandit_id: string
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          pandit_id: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string | null
          paid_at?: string | null
          pandit_id?: string
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pandit_payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pandit_payouts_pandit_id_fkey"
            columns: ["pandit_id"]
            isOneToOne: false
            referencedRelation: "pandits"
            referencedColumns: ["id"]
          },
        ]
      }
      pandits: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          city: string
          created_at: string
          experience: number
          id: string
          ifsc: string | null
          initials: string
          languages: Json
          name: string
          rating: number
          reviews: number
          specialties: Json
          updated_at: string
          upi_id: string | null
          user_id: string | null
          verified: boolean
          visible: boolean
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          city?: string
          created_at?: string
          experience?: number
          id?: string
          ifsc?: string | null
          initials?: string
          languages?: Json
          name: string
          rating?: number
          reviews?: number
          specialties?: Json
          updated_at?: string
          upi_id?: string | null
          user_id?: string | null
          verified?: boolean
          visible?: boolean
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          city?: string
          created_at?: string
          experience?: number
          id?: string
          ifsc?: string | null
          initials?: string
          languages?: Json
          name?: string
          rating?: number
          reviews?: number
          specialties?: Json
          updated_at?: string
          upi_id?: string | null
          user_id?: string | null
          verified?: boolean
          visible?: boolean
        }
        Relationships: []
      }
      poojas: {
        Row: {
          created_at: string
          description: string
          duration: string
          image_url: string | null
          includes: Json
          name: string
          popular: boolean
          price_from: number
          samagri_included: boolean
          season: string | null
          slug: string
          tagline: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string
          duration?: string
          image_url?: string | null
          includes?: Json
          name: string
          popular?: boolean
          price_from?: number
          samagri_included?: boolean
          season?: string | null
          slug: string
          tagline?: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          duration?: string
          image_url?: string | null
          includes?: Json
          name?: string
          popular?: boolean
          price_from?: number
          samagri_included?: boolean
          season?: string | null
          slug?: string
          tagline?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reference_id: string | null
          source: string
          target_id: string
          target_kind: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reference_id?: string | null
          source?: string
          target_id: string
          target_kind: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reference_id?: string | null
          source?: string
          target_id?: string
          target_kind?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_skus: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["sku_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          mrp_paise: number
          name: string
          price_paise: number
          slug: string
          sort_order: number
          stock: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["sku_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          mrp_paise: number
          name: string
          price_paise: number
          slug: string
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["sku_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          mrp_paise?: number
          name?: string
          price_paise?: number
          slug?: string
          sort_order?: number
          stock?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      support_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string | null
          source: string
          status: string
          subject: string
          transcript: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name?: string | null
          source?: string
          status?: string
          subject: string
          transcript?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string | null
          source?: string
          status?: string
          subject?: string
          transcript?: Json | null
          updated_at?: string
          user_id?: string | null
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
      apply_referral_code: { Args: { _code: string }; Returns: Json }
      create_notification: {
        Args: {
          _body?: string
          _data?: Json
          _link?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      generate_referral_code: { Args: never; Returns: string }
      get_credit_balance: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_admins: {
        Args: { _body: string; _link: string; _title: string; _type: string }
        Returns: undefined
      }
      redeem_credits: {
        Args: { _amount_paise: number; _description: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "pandit" | "user"
      sku_category: "kit" | "samagri" | "blessed"
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
      app_role: ["admin", "pandit", "user"],
      sku_category: ["kit", "samagri", "blessed"],
    },
  },
} as const
