export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      payment_requests: {
        Row: {
          amount: string | null
          created_at: string | null
          from_user_id: string | null
          id: string
          status: string | null
          to: string | null
          to_user_id: string | null
        }
        Insert: {
          amount?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          status?: string | null
          to?: string | null
          to_user_id?: string | null
        }
        Update: {
          amount?: string | null
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          status?: string | null
          to?: string | null
          to_user_id?: string | null
        }
      }
      users: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string | null
          phone_number: string
          private_key: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phone_number: string
          private_key?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          phone_number?: string
          private_key?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
