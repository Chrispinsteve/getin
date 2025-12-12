import type { Database } from "./database"

export type Listing = Database["public"]["Tables"]["listings"]["Row"]

export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"]

export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"]

export interface ListingWithRelations extends Listing {
  host?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  bookings?: Booking[]
}

export interface ListingPhoto {
  url: string
  caption?: string
}

export interface ListingFilters {
  property_type?: string
  city?: string
  state?: string
  country?: string
  min_price?: number
  max_price?: number
  amenities?: string[]
  check_in?: string
  check_out?: string
  guests?: number
}

export interface ListingSearchParams {
  page?: number
  limit?: number
  sort?: "price_asc" | "price_desc" | "newest" | "oldest"
  filters?: ListingFilters
}

// Re-export for convenience
import type { Booking } from "./booking"
export type { Booking }

