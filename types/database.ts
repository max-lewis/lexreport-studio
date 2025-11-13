// Database types generated from Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          title: string
          slug: string
          meta: Json
          theme_config_id: string | null
          created_by: string
          is_deleted: boolean
          deleted_at: string | null
          published: boolean
          published_at: string | null
          viewer_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          meta?: Json
          theme_config_id?: string | null
          created_by: string
          is_deleted?: boolean
          deleted_at?: string | null
          published?: boolean
          published_at?: string | null
          viewer_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          meta?: Json
          theme_config_id?: string | null
          created_by?: string
          is_deleted?: boolean
          deleted_at?: string | null
          published?: boolean
          published_at?: string | null
          viewer_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          report_id: string
          type: SectionType
          title: string | null
          order_index: number
          parent_id: string | null
          content_blocks: Json
          style_overrides: Json | null
          interaction_hints: Json | null
          locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          type: SectionType
          title?: string | null
          order_index: number
          parent_id?: string | null
          content_blocks?: Json
          style_overrides?: Json | null
          interaction_hints?: Json | null
          locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          type?: SectionType
          title?: string | null
          order_index?: number
          parent_id?: string | null
          content_blocks?: Json
          style_overrides?: Json | null
          interaction_hints?: Json | null
          locked?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      citations: {
        Row: {
          id: string
          report_id: string
          citation_type: CitationType
          style: CitationStyle
          label: string
          raw_text: string
          normalized_text: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          citation_type: CitationType
          style: CitationStyle
          label: string
          raw_text: string
          normalized_text?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          citation_type?: CitationType
          style?: CitationStyle
          label?: string
          raw_text?: string
          normalized_text?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      visual_assets: {
        Row: {
          id: string
          report_id: string
          asset_type: AssetType
          title: string | null
          caption: string | null
          alt_text: string | null
          storage_path: string | null
          embed_code: string | null
          data: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          report_id: string
          asset_type: AssetType
          title?: string | null
          caption?: string | null
          alt_text?: string | null
          storage_path?: string | null
          embed_code?: string | null
          data?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          asset_type?: AssetType
          title?: string | null
          caption?: string | null
          alt_text?: string | null
          storage_path?: string | null
          embed_code?: string | null
          data?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      theme_configs: {
        Row: {
          id: string
          name: string
          is_system: boolean
          fonts: Json
          colors: Json
          spacing_scale: Json
          border_radius_scale: Json
          typography: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          is_system?: boolean
          fonts: Json
          colors: Json
          spacing_scale: Json
          border_radius_scale: Json
          typography: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_system?: boolean
          fonts?: Json
          colors?: Json
          spacing_scale?: Json
          border_radius_scale?: Json
          typography?: Json
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      section_type: SectionType
      citation_type: CitationType
      citation_style: CitationStyle
      asset_type: AssetType
    }
  }
}

// Enum types
export type SectionType =
  | 'title_page'
  | 'executive_summary'
  | 'table_of_contents'
  | 'introduction'
  | 'background'
  | 'analysis'
  | 'findings'
  | 'discussion'
  | 'methodology'
  | 'recommendations'
  | 'conclusion'
  | 'appendix'
  | 'exhibit'
  | 'references'
  | 'glossary'
  | 'acknowledgments'
  | 'custom'

export type CitationType = 'footnote' | 'exhibit' | 'figure'

export type CitationStyle = 'footnote' | 'apa' | 'mla' | 'bluebook' | 'custom'

export type AssetType = 'image' | 'chart' | 'table' | 'video' | 'interactive' | 'file'

// Helper types for application use
export type Report = Database['public']['Tables']['reports']['Row']
export type Section = Database['public']['Tables']['sections']['Row']
export type Citation = Database['public']['Tables']['citations']['Row']
export type VisualAsset = Database['public']['Tables']['visual_assets']['Row']
export type ThemeConfig = Database['public']['Tables']['theme_configs']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type User = Database['public']['Tables']['users']['Row']
