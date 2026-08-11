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
      announcements: {
        Row: {
          active: boolean
          created_at: string
          id: string
          message: string
          variant: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          message: string
          variant?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          message?: string
          variant?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          kind: Database["public"]["Enums"]["product_kind"] | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["product_kind"] | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["product_kind"] | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      community_categories: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          github_category_id: string
          id: string
          name: string
          section: string
          slug: string
          sort_order: number
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          github_category_id: string
          id?: string
          name: string
          section?: string
          slug: string
          sort_order?: number
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          github_category_id?: string
          id?: string
          name?: string
          section?: string
          slug?: string
          sort_order?: number
          visible?: boolean
        }
        Relationships: []
      }
      community_settings: {
        Row: {
          allow_new_discussions: boolean
          comments_enabled: boolean
          enabled: boolean
          id: string
          input_position: string
          lazy_load: boolean
          mapping: string
          reactions_enabled: boolean
          repo_id: string | null
          repo_name: string
          repo_owner: string
          show_github_links: boolean
          theme: string
          theme_follows_site: boolean
          updated_at: string
        }
        Insert: {
          allow_new_discussions?: boolean
          comments_enabled?: boolean
          enabled?: boolean
          id?: string
          input_position?: string
          lazy_load?: boolean
          mapping?: string
          reactions_enabled?: boolean
          repo_id?: string | null
          repo_name?: string
          repo_owner?: string
          show_github_links?: boolean
          theme?: string
          theme_follows_site?: boolean
          updated_at?: string
        }
        Update: {
          allow_new_discussions?: boolean
          comments_enabled?: boolean
          enabled?: boolean
          id?: string
          input_position?: string
          lazy_load?: boolean
          mapping?: string
          reactions_enabled?: boolean
          repo_id?: string | null
          repo_name?: string
          repo_owner?: string
          show_github_links?: boolean
          theme?: string
          theme_follows_site?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      developers: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          verified: boolean
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      downloads: {
        Row: {
          architecture: string | null
          created_at: string
          download_count: number
          format: string
          id: string
          is_primary: boolean
          mirror_name: string | null
          platform: string
          product_id: string
          size_bytes: number | null
          url: string
          version: string | null
        }
        Insert: {
          architecture?: string | null
          created_at?: string
          download_count?: number
          format: string
          id?: string
          is_primary?: boolean
          mirror_name?: string | null
          platform: string
          product_id: string
          size_bytes?: number | null
          url: string
          version?: string | null
        }
        Update: {
          architecture?: string | null
          created_at?: string
          download_count?: number
          format?: string
          id?: string
          is_primary?: boolean
          mirror_name?: string | null
          platform?: string
          product_id?: string
          size_bytes?: number | null
          url?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          slug: string
          title: string
        }
        Insert: {
          body?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          slug: string
          title: string
        }
        Update: {
          body?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          slug?: string
          title?: string
        }
        Relationships: []
      }
      preorders: {
        Row: {
          created_at: string
          email: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          architectures: string[] | null
          banner_opacity: number
          banner_url: string | null
          category_id: string | null
          changelog: string | null
          coming_soon: boolean
          created_at: string
          dependencies: string[] | null
          description: string | null
          developer_id: string | null
          documentation_url: string | null
          download_count: number
          extra_guidance: string | null
          featured: boolean
          features: string[] | null
          file_size: string | null
          homepage_order: number
          icon_url: string | null
          id: string
          kind: Database["public"]["Enums"]["product_kind"]
          known_issues: string | null
          latest_version: string | null
          license: string | null
          name: string
          platforms: string[] | null
          play_modes: Database["public"]["Enums"]["play_mode"][] | null
          published: boolean
          publisher: string | null
          rating_avg: number
          rating_count: number
          release_date: string | null
          requirements: string | null
          roadmap: string | null
          slug: string
          source_type: Database["public"]["Enums"]["source_type"]
          source_url: string | null
          status: Database["public"]["Enums"]["product_status"]
          tagline: string | null
          trailer_url: string | null
          updated_at: string
        }
        Insert: {
          architectures?: string[] | null
          banner_opacity?: number
          banner_url?: string | null
          category_id?: string | null
          changelog?: string | null
          coming_soon?: boolean
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          developer_id?: string | null
          documentation_url?: string | null
          download_count?: number
          extra_guidance?: string | null
          featured?: boolean
          features?: string[] | null
          file_size?: string | null
          homepage_order?: number
          icon_url?: string | null
          id?: string
          kind: Database["public"]["Enums"]["product_kind"]
          known_issues?: string | null
          latest_version?: string | null
          license?: string | null
          name: string
          platforms?: string[] | null
          play_modes?: Database["public"]["Enums"]["play_mode"][] | null
          published?: boolean
          publisher?: string | null
          rating_avg?: number
          rating_count?: number
          release_date?: string | null
          requirements?: string | null
          roadmap?: string | null
          slug: string
          source_type?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          tagline?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Update: {
          architectures?: string[] | null
          banner_opacity?: number
          banner_url?: string | null
          category_id?: string | null
          changelog?: string | null
          coming_soon?: boolean
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          developer_id?: string | null
          documentation_url?: string | null
          download_count?: number
          extra_guidance?: string | null
          featured?: boolean
          features?: string[] | null
          file_size?: string | null
          homepage_order?: number
          icon_url?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["product_kind"]
          known_issues?: string | null
          latest_version?: string | null
          license?: string | null
          name?: string
          platforms?: string[] | null
          play_modes?: Database["public"]["Enums"]["play_mode"][] | null
          published?: boolean
          publisher?: string | null
          rating_avg?: number
          rating_count?: number
          release_date?: string | null
          requirements?: string | null
          roadmap?: string | null
          slug?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          tagline?: string | null
          trailer_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["request_type"]
          product_id: string | null
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["request_type"]
          product_id?: string | null
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["request_type"]
          product_id?: string | null
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          dislikes: number
          id: string
          likes: number
          pinned: boolean
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          dislikes?: number
          id?: string
          likes?: number
          pinned?: boolean
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          dislikes?: number
          id?: string
          likes?: number
          pinned?: boolean
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshots: {
        Row: {
          caption: string | null
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          downloads_count: string | null
          entertainment_icon: string | null
          key: string
          player_count: string | null
          studios_icon: string | null
          updated_at: string
          user_count: string | null
          value: Json
        }
        Insert: {
          downloads_count?: string | null
          entertainment_icon?: string | null
          key: string
          player_count?: string | null
          studios_icon?: string | null
          updated_at?: string
          user_count?: string | null
          value: Json
        }
        Update: {
          downloads_count?: string | null
          entertainment_icon?: string | null
          key?: string
          player_count?: string | null
          studios_icon?: string | null
          updated_at?: string
          user_count?: string | null
          value?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
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
      versions: {
        Row: {
          changelog: string | null
          id: string
          is_latest: boolean
          product_id: string
          released_at: string
          version: string
        }
        Insert: {
          changelog?: string | null
          id?: string
          is_latest?: boolean
          product_id: string
          released_at?: string
          version: string
        }
        Update: {
          changelog?: string | null
          id?: string
          is_latest?: boolean
          product_id?: string
          released_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "moderator" | "user"
      play_mode:
        | "single_player"
        | "multiplayer"
        | "lan"
        | "online"
        | "offline"
        | "cross_platform"
      product_kind: "app" | "game" | "ai"
      product_status:
        | "stable"
        | "beta"
        | "experimental"
        | "deprecated"
        | "abandoned"
      request_type:
        | "bug"
        | "feature"
        | "app_request"
        | "game_request"
        | "review_request"
      source_type:
        | "open_source"
        | "closed_source"
        | "mod"
        | "official"
        | "community"
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
      app_role: ["admin", "moderator", "user"],
      play_mode: [
        "single_player",
        "multiplayer",
        "lan",
        "online",
        "offline",
        "cross_platform",
      ],
      product_kind: ["app", "game", "ai"],
      product_status: [
        "stable",
        "beta",
        "experimental",
        "deprecated",
        "abandoned",
      ],
      request_type: [
        "bug",
        "feature",
        "app_request",
        "game_request",
        "review_request",
      ],
      source_type: [
        "open_source",
        "closed_source",
        "mod",
        "official",
        "community",
      ],
    },
  },
} as const
