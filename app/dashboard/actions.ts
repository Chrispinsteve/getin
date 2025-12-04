"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ListingInput } from "@/app/become-a-host/actions"

export interface HostListing {
  id: string
  property_type: string
  country: string
  street: string
  city: string
  state: string
  zip: string | null
  latitude: number | null
  longitude: number | null
  amenities: string[]
  photos: { id: string; url: string; name: string }[]
  base_price: number
  cleaning_fee: number
  additional_guest_fee: number
  smart_pricing: boolean
  min_stay: number
  max_stay: number
  instant_book: boolean
  blocked_dates: string[]
  status: "draft" | "published" | "archived"
  created_at: string
  updated_at: string
}

// Get all listings for the current host (for now, all listings since auth isn't implemented)
export async function getHostListings(status?: "draft" | "published" | "archived") {
  const supabase = await createClient()

  let query = supabase.from("listings").select("*").order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data: listings, error } = await query

  if (error) {
    console.error("Error fetching host listings:", error)
    return { success: false, error: error.message, listings: [] }
  }

  return { success: true, listings: (listings as HostListing[]) || [] }
}

// Get a single listing by ID
export async function getListingById(id: string) {
  const supabase = await createClient()

  const { data: listing, error } = await supabase.from("listings").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching listing:", error)
    return { success: false, error: error.message, listing: null }
  }

  return { success: true, listing: listing as HostListing | null }
}

// Update an existing listing
export async function updateListing(id: string, data: ListingInput, status?: "draft" | "published" | "archived") {
  const supabase = await createClient()

  const updateData: any = {
    property_type: data.propertyType,
    country: data.location.country,
    street: data.location.street,
    city: data.location.city,
    state: data.location.state,
    zip: data.location.zip,
    latitude: data.location.coordinates?.lat ?? null,
    longitude: data.location.coordinates?.lng ?? null,
    amenities: data.amenities,
    photos: data.photos,
    base_price: data.pricing.basePrice,
    cleaning_fee: data.pricing.cleaningFee,
    additional_guest_fee: data.pricing.additionalGuestFee,
    smart_pricing: data.pricing.smartPricing,
    min_stay: data.availability.minStay,
    max_stay: data.availability.maxStay,
    instant_book: data.availability.instantBook,
    blocked_dates: data.availability.blockedDates,
    updated_at: new Date().toISOString(),
  }

  if (status) {
    updateData.status = status
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating listing:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/listings")
  revalidatePath(`/dashboard/listings/${id}`)
  return { success: true, listing }
}

// Delete/Archive a listing
export async function deleteListing(id: string) {
  const supabase = await createClient()

  // Soft delete by archiving
  const { error } = await supabase.from("listings").update({ status: "archived" }).eq("id", id)

  if (error) {
    console.error("Error deleting listing:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/listings")
  return { success: true }
}

// Toggle listing status (active/inactive)
export async function toggleListingStatus(id: string, currentStatus: string) {
  const supabase = await createClient()

  const newStatus = currentStatus === "published" ? "draft" : "published"

  const { data: listing, error } = await supabase
    .from("listings")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error toggling listing status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/listings")
  return { success: true, listing }
}

// Get dashboard statistics
export async function getDashboardStats() {
  const supabase = await createClient()

  const { data: listings, error } = await supabase.from("listings").select("status, base_price")

  if (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      success: false,
      stats: {
        activeListings: 0,
        totalEarnings: 0,
        upcomingBookings: 0,
        occupancyRate: 0,
      },
    }
  }

  const activeListings = listings?.filter((l) => l.status === "published").length || 0
  const totalListings = listings?.length || 0
  const totalEarnings = listings?.reduce((sum, l) => sum + (l.base_price || 0), 0) || 0

  // Mock data for bookings and occupancy (will be replaced when bookings table is created)
  const upcomingBookings = 0
  const occupancyRate = totalListings > 0 ? Math.round((activeListings / totalListings) * 100) : 0

  return {
    success: true,
    stats: {
      activeListings,
      totalEarnings: Math.round(totalEarnings),
      upcomingBookings,
      occupancyRate,
    },
  }
}

