"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ensureHostExists } from "@/app/(auth)/actions"

export interface ListingInput {
  propertyType: string
  title?: string
  description?: string
  location: {
    country: string
    street: string
    city: string
    state: string
    zip: string
    coordinates: { lat: number; lng: number } | null
  }
  details?: {
    bedrooms: number
    beds: number
    bathrooms: number
    maxGuests: number
  }
  amenities: string[]
  houseRules?: string[]
  photos: { id: string; url: string; name: string }[]
  pricing: {
    basePrice: number
    weekendPrice?: number
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
  cancellationPolicy?: string
}

const propertyTypeLabels: Record<string, string> = {
  "entire-home": "Maison entière",
  "private-room": "Chambre privée",
  "shared-room": "Chambre partagée",
  apartment: "Appartement",
  guesthouse: "Maison d'hôtes",
  villa: "Villa",
  studio: "Studio",
  unique: "Logement unique",
}

export async function createListing(data: ListingInput, status: "draft" | "published") {
  const supabase = await createClient()

  // Récupérer ou créer le host_id
  const { hostId, error: hostError } = await ensureHostExists()

  if (hostError || !hostId) {
    return {
      success: false,
      error: hostError || "Vous devez être connecté pour créer une annonce",
    }
  }

  // Générer un titre par défaut si non fourni
  const defaultTitle = `${propertyTypeLabels[data.propertyType] || data.propertyType} à ${data.location.city}`

  // Générer un slug unique
  const slug = `${data.location.city.toLowerCase().replace(/\s+/g, "-")}-${data.propertyType}-${Date.now()}`

  const insertData = {
    host_id: hostId,
    title: data.title || defaultTitle,
    description: data.description || `Découvrez ce magnifique ${propertyTypeLabels[data.propertyType] || data.propertyType} situé à ${data.location.city}.`,
    property_type: data.propertyType,
    country: data.location.country,
    street: data.location.street,
    city: data.location.city,
    state: data.location.state,
    zip: data.location.zip || null,
    latitude: data.location.coordinates?.lat ?? null,
    longitude: data.location.coordinates?.lng ?? null,
    bedrooms: data.details?.bedrooms ?? 1,
    beds: data.details?.beds ?? 1,
    bathrooms: data.details?.bathrooms ?? 1,
    max_guests: data.details?.maxGuests ?? 2,
    amenities: data.amenities,
    house_rules: data.houseRules || [],
    photos: data.photos,
    base_price: data.pricing.basePrice,
    weekend_price: data.pricing.weekendPrice ?? null,
    cleaning_fee: data.pricing.cleaningFee,
    additional_guest_fee: data.pricing.additionalGuestFee,
    smart_pricing: data.pricing.smartPricing,
    min_stay: data.availability.minStay,
    max_stay: data.availability.maxStay,
    instant_book: data.availability.instantBook,
    blocked_dates: data.availability.blockedDates,
    cancellation_policy: data.cancellationPolicy || "flexible",
    status: status,
    slug: slug,
    published_at: status === "published" ? new Date().toISOString() : null,
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error("Error creating listing:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/")
  revalidatePath("/dashboard/listings")
  return { success: true, listing }
}

export async function getListings(filters?: {
  city?: string
  country?: string
  minPrice?: number
  maxPrice?: number
  propertyType?: string
  amenities?: string[]
  minBedrooms?: number
  maxGuests?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from("listings")
    .select(`
      *,
      host:hosts(
        id,
        first_name,
        last_name,
        profile_picture_url,
        superhost,
        average_rating,
        response_rate
      )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  // Apply filters
  if (filters?.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }
  if (filters?.country) {
    query = query.eq("country", filters.country)
  }
  if (filters?.minPrice) {
    query = query.gte("base_price", filters.minPrice)
  }
  if (filters?.maxPrice) {
    query = query.lte("base_price", filters.maxPrice)
  }
  if (filters?.propertyType) {
    query = query.eq("property_type", filters.propertyType)
  }
  if (filters?.amenities && filters.amenities.length > 0) {
    query = query.contains("amenities", filters.amenities)
  }
  if (filters?.minBedrooms) {
    query = query.gte("bedrooms", filters.minBedrooms)
  }
  if (filters?.maxGuests) {
    query = query.gte("max_guests", filters.maxGuests)
  }

  const { data: listings, error } = await query

  if (error) {
    console.error("Error fetching listings:", error)
    return { success: false, error: error.message, listings: [] }
  }

  return { success: true, listings }
}

export async function getListingByIdPublic(id: string) {
  const supabase = await createClient()

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      host:hosts(
        id,
        first_name,
        last_name,
        profile_picture_url,
        bio,
        superhost,
        average_rating,
        response_rate,
        response_time_hours,
        total_reviews:reviews(count),
        created_at
      )
    `)
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (error) {
    console.error("Error fetching listing:", error)
    return { success: false, error: error.message, listing: null }
  }

  // Fetch reviews separately
  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      overall_rating,
      cleanliness_rating,
      accuracy_rating,
      communication_rating,
      location_rating,
      check_in_rating,
      value_rating,
      review_text,
      host_response,
      created_at
    `)
    .eq("listing_id", id)
    .eq("review_type", "guest_to_host")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10)

  // Increment view count
  await supabase
    .from("listings")
    .update({ views_count: (listing.views_count || 0) + 1 })
    .eq("id", id)

  return {
    success: true,
    listing: {
      ...listing,
      reviews: reviews || [],
    },
  }
}

export async function getListingBySlug(slug: string) {
  const supabase = await createClient()

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      *,
      host:hosts(
        id,
        first_name,
        last_name,
        profile_picture_url,
        bio,
        superhost,
        average_rating,
        response_rate,
        response_time_hours,
        created_at
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error) {
    return { success: false, error: error.message, listing: null }
  }

  return { success: true, listing }
}

// ===== UPLOAD PHOTOS =====

export async function uploadListingPhoto(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Non authentifié" }
  }

  const file = formData.get("file") as File

  if (!file) {
    return { success: false, error: "Aucun fichier fourni" }
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "Type de fichier non supporté. Utilisez JPG, PNG, WebP ou GIF.",
    }
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      success: false,
      error: "Le fichier est trop volumineux. Maximum 5MB.",
    }
  }

  // Generate unique filename with user folder
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("listing-photos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    console.error("Upload error:", uploadError)
    return { success: false, error: "Erreur lors de l'upload de l'image" }
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("listing-photos")
    .getPublicUrl(fileName)

  return {
    success: true,
    photo: {
      id: fileName,
      url: urlData.publicUrl,
      name: file.name,
    },
  }
}

export async function deleteListingPhoto(photoPath: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: "Non authentifié" }
  }

  // Verify the photo belongs to the user
  if (!photoPath.startsWith(user.id)) {
    return { success: false, error: "Non autorisé" }
  }

  const { error } = await supabase.storage
    .from("listing-photos")
    .remove([photoPath])

  if (error) {
    console.error("Delete error:", error)
    return { success: false, error: "Erreur lors de la suppression" }
  }

  return { success: true }
}

// ===== CHECK AVAILABILITY =====

export async function checkAvailability(
  listingId: string,
  checkIn: string,
  checkOut: string
) {
  const supabase = await createClient()

  // Use the database function
  const { data, error } = await supabase.rpc("check_listing_availability", {
    p_listing_id: listingId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })

  if (error) {
    console.error("Error checking availability:", error)
    // Fallback: manual check
    const { data: listing } = await supabase
      .from("listings")
      .select("blocked_dates")
      .eq("id", listingId)
      .single()

    const { data: bookings } = await supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("listing_id", listingId)
      .in("status", ["pending", "accepted"])

    // Check blocked dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (listing?.blocked_dates) {
      for (const blockedDate of listing.blocked_dates) {
        const blocked = new Date(blockedDate)
        if (blocked >= checkInDate && blocked < checkOutDate) {
          return { success: true, available: false }
        }
      }
    }

    // Check existing bookings
    if (bookings) {
      for (const booking of bookings) {
        const bookingStart = new Date(booking.check_in)
        const bookingEnd = new Date(booking.check_out)

        if (
          (checkInDate >= bookingStart && checkInDate < bookingEnd) ||
          (checkOutDate > bookingStart && checkOutDate <= bookingEnd) ||
          (checkInDate <= bookingStart && checkOutDate >= bookingEnd)
        ) {
          return { success: true, available: false }
        }
      }
    }

    return { success: true, available: true }
  }

  return { success: true, available: data }
}

// ===== SEARCH NEARBY =====

export async function searchNearbyListings(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
) {
  const supabase = await createClient()

  // Use PostGIS for geo search if available
  const { data: listings, error } = await supabase
    .from("listings")
    .select(`
      *,
      host:hosts(first_name, last_name, profile_picture_url, superhost)
    `)
    .eq("status", "published")
    .not("latitude", "is", null)
    .not("longitude", "is", null)

  if (error) {
    console.error("Error searching nearby listings:", error)
    return { success: false, error: error.message, listings: [] }
  }

  // Filter by distance (Haversine formula)
  const nearbyListings = listings?.filter((listing) => {
    if (!listing.latitude || !listing.longitude) return false

    const R = 6371 // Earth's radius in km
    const dLat = ((listing.latitude - latitude) * Math.PI) / 180
    const dLon = ((listing.longitude - longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((listing.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance <= radiusKm
  })

  return { success: true, listings: nearbyListings || [] }
}
