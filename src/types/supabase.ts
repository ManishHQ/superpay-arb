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
      user_profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          email: string
          avatar_url: string | null
          role: 'person' | 'business'
          business_name: string | null
          business_type: string | null
          business_description: string | null
          wallet_address: string | null
          dynamic_user_id: string | null
          display_name: string | null
          bio: string | null
          is_active: boolean
          is_verified: boolean
          show_wallet_address: boolean
          show_email: boolean
          allow_search: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          username: string
          full_name?: string | null
          email: string
          avatar_url?: string | null
          role?: 'person' | 'business'
          business_name?: string | null
          business_type?: string | null
          business_description?: string | null
          wallet_address?: string | null
          dynamic_user_id?: string | null
          display_name?: string | null
          bio?: string | null
          is_active?: boolean
          is_verified?: boolean
          show_wallet_address?: boolean
          show_email?: boolean
          allow_search?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          email?: string
          avatar_url?: string | null
          role?: 'person' | 'business'
          business_name?: string | null
          business_type?: string | null
          business_description?: string | null
          wallet_address?: string | null
          dynamic_user_id?: string | null
          display_name?: string | null
          bio?: string | null
          is_active?: boolean
          is_verified?: boolean
          show_wallet_address?: boolean
          show_email?: boolean
          allow_search?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          amount: number
          currency: string
          note: string | null
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          transaction_hash: string | null
          block_number: number | null
          blockchain: string | null
          network: string | null
          gas_fee: number | null
          gas_fee_currency: string | null
          platform_fee: number | null
          platform_fee_currency: string | null
          transaction_type: 'transfer' | 'request' | 'split' | 'refund'
          is_internal: boolean
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          amount: number
          currency?: string
          note?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          transaction_hash?: string | null
          block_number?: number | null
          blockchain?: string | null
          network?: string | null
          gas_fee?: number | null
          gas_fee_currency?: string | null
          platform_fee?: number | null
          platform_fee_currency?: string | null
          transaction_type?: 'transfer' | 'request' | 'split' | 'refund'
          is_internal?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          currency?: string
          note?: string | null
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          transaction_hash?: string | null
          block_number?: number | null
          blockchain?: string | null
          network?: string | null
          gas_fee?: number | null
          gas_fee_currency?: string | null
          platform_fee?: number | null
          platform_fee_currency?: string | null
          transaction_type?: 'transfer' | 'request' | 'split' | 'refund'
          is_internal?: boolean
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_contacts: {
        Row: {
          id: string
          user_id: string
          contact_user_id: string
          nickname: string | null
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_user_id: string
          nickname?: string | null
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_user_id?: string
          nickname?: string | null
          is_favorite?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_contacts_contact_user_id_fkey"
            columns: ["contact_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      transaction_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          amount: number
          currency: string
          note: string | null
          status: 'pending' | 'approved' | 'declined' | 'expired' | 'cancelled'
          expires_at: string
          transaction_id: string | null
          created_at: string
          updated_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          amount: number
          currency?: string
          note?: string | null
          status?: 'pending' | 'approved' | 'declined' | 'expired' | 'cancelled'
          expires_at?: string
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          currency?: string
          note?: string | null
          status?: 'pending' | 'approved' | 'declined' | 'expired' | 'cancelled'
          expires_at?: string
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_requests_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_requests_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          transaction_notifications: boolean
          request_notifications: boolean
          default_currency: string
          theme: 'light' | 'dark' | 'system'
          language: string
          require_confirmation: boolean
          biometric_enabled: boolean
          auto_logout_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          transaction_notifications?: boolean
          request_notifications?: boolean
          default_currency?: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          require_confirmation?: boolean
          biometric_enabled?: boolean
          auto_logout_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          transaction_notifications?: boolean
          request_notifications?: boolean
          default_currency?: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          require_confirmation?: boolean
          biometric_enabled?: boolean
          auto_logout_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_dashboard_stats: {
        Row: {
          user_id: string
          username: string
          transactions_sent: number
          transactions_received: number
          total_transactions: number
          total_sent_usdc: number
          total_received_usdc: number
          last_transaction_at: string | null
          contact_count: number
        }
      }
    }
    Functions: {
      search_users: {
        Args: {
          search_term: string
          requesting_user_id?: string
        }
        Returns: {
          id: string
          username: string
          full_name: string
          email: string | null
          avatar_url: string | null
          wallet_address: string | null
          display_name: string | null
          role: string
          business_name: string | null
          business_type: string | null
          is_favorite: boolean
        }[]
      }
      get_user_transactions: {
        Args: {
          user_id_param: string
          limit_param?: number
          offset_param?: number
        }
        Returns: {
          id: string
          amount: number
          currency: string
          note: string | null
          status: string
          transaction_type: string
          transaction_hash: string | null
          created_at: string
          completed_at: string | null
          other_user_id: string
          other_user_username: string
          other_user_name: string | null
          other_user_avatar: string | null
          is_sender: boolean
        }[]
      }
    }
    Enums: {
      user_role: 'person' | 'business'
      transaction_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
      request_status: 'pending' | 'approved' | 'declined' | 'expired' | 'cancelled'
      transaction_type: 'transfer' | 'request' | 'split' | 'refund'
      theme_type: 'light' | 'dark' | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type exports for easy use
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export type UserContact = Database['public']['Tables']['user_contacts']['Row'];
export type UserContactInsert = Database['public']['Tables']['user_contacts']['Insert'];
export type UserContactUpdate = Database['public']['Tables']['user_contacts']['Update'];

export type TransactionRequest = Database['public']['Tables']['transaction_requests']['Row'];
export type TransactionRequestInsert = Database['public']['Tables']['transaction_requests']['Insert'];
export type TransactionRequestUpdate = Database['public']['Tables']['transaction_requests']['Update'];

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

export type UserDashboardStats = Database['public']['Views']['user_dashboard_stats']['Row'];