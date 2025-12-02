"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface ListingInput {
  propertyType: string
  location: {
    country: string
    street: string
    city: string
    state: string
    zip: string
    coordinates: { lat: number; lng: number } | null
  }
  amenities: string[]
  photos: { id: string; url: string; name: string }[]
  pricing: {
    basePrice: number
    cleaningFee: number
    additionalGuestFee: number
    smartPricing: boolean
  }
  availability: {
    blockedDates: string[]
    minStay: number
    maxStay: number
    instantBook: boolean
  }
}

export async function createListing(data: ListingInput, status: "draft" | "published") {
  const supabase = await createClient()

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
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
      status: status,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating listing:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  return { success: true, listing }
}

export async function getListings() {
  const supabase = await createClient()

  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching listings:", error)
    return { success: false, error: error.message, listings: [] }
  }

  return { success: true, listings }
}
