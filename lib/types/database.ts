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
      listings: {
        Row: {
          id: string
          host_id: string
          property_type: string
          country: string
          street: string
          city: string
          state: string | null
          zip: string | null
          latitude: number | null
          longitude: number | null
          amenities: Json
          photos: Json
          base_price: number
          cleaning_fee: number | null
          additional_guest_fee: number | null
          smart_pricing: boolean
          instant_book: boolean
          blocked_dates: Json
          min_stay: number | null
          max_stay: number | null
          status: "draft" | "published"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          property_type: string
          country: string
          street: string
          city: string
          state?: string | null
          zip?: string | null
          latitude?: number | null
          longitude?: number | null
          amenities?: Json
          photos?: Json
          base_price: number
          cleaning_fee?: number | null
          additional_guest_fee?: number | null
          smart_pricing?: boolean
          instant_book?: boolean
          blocked_dates?: Json
          min_stay?: number | null
          max_stay?: number | null
          status?: "draft" | "published"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          property_type?: string
          country?: string
          street?: string
          city?: string
          state?: string | null
          zip?: string | null
          latitude?: number | null
          longitude?: number | null
          amenities?: Json
          photos?: Json
          base_price?: number
          cleaning_fee?: number | null
          additional_guest_fee?: number | null
          smart_pricing?: boolean
          instant_book?: boolean
          blocked_dates?: Json
          min_stay?: number | null
          max_stay?: number | null
          status?: "draft" | "published"
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          listing_id: string
          guest_id: string | null
          host_id: string
          check_in: string
          check_out: string
          guests: number
          total_price: number
          status: "pending" | "confirmed" | "cancelled" | "completed"
          guest_name: string
          guest_email: string
          guest_phone: string | null
          special_requests: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          guest_id?: string | null
          host_id: string
          check_in: string
          check_out: string
          guests: number
          total_price: number
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          guest_name: string
          guest_email: string
          guest_phone?: string | null
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          guest_id?: string | null
          host_id?: string
          check_in?: string
          check_out?: string
          guests?: number
          total_price?: number
          status?: "pending" | "confirmed" | "cancelled" | "completed"
          guest_name?: string
          guest_email?: string
          guest_phone?: string | null
          special_requests?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
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
  }
}

