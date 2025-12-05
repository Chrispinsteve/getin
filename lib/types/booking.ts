import type { Database } from "./database"

export type Booking = Database["public"]["Tables"]["bookings"]["Row"]

export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"]

export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"]

export interface BookingWithRelations extends Booking {
  listing?: {
    id: string
    property_type: string
    city: string
    state: string | null
    country: string
    photos: any
    base_price: number
  }
  guest?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  host?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export type BookingStatus = Booking["status"]

export interface BookingCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: BookingStatus
  booking: Booking
}

