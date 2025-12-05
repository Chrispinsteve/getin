"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { ensureHostExists } from "@/app/(auth)/actions"

// ===== TYPES =====

export interface HostListing {
  id: string
  host_id: string
  title: string
  description: string
  property_type: string
  country: string
  street: string
  city: string
  state: string
  zip: string | null
  latitude: number | null
  longitude: number | null
  bedrooms: number
  beds: number
  bathrooms: number
  max_guests: number
  amenities: string[]
  house_rules: string[]
  photos: { id: string; url: string; name: string; order?: number; is_cover?: boolean }[]
  base_price: number
  weekend_price: number | null
  cleaning_fee: number
  additional_guest_fee: number
  smart_pricing: boolean
  min_stay: number
  max_stay: number
  instant_book: boolean
  blocked_dates: string[]
  cancellation_policy: string
  status: "draft" | "published" | "archived" | "suspended"
  views_count: number
  favorites_count: number
  bookings_count: number
  average_rating: number
  reviews_count: number
  created_at: string
  updated_at: string
}

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

export interface Booking {
  id: string
  listing_id: string
  host_id: string
  guest_id: string
  check_in: string
  check_out: string
  num_guests: number
  nights: number
  base_price_per_night: number
  total_nights_cost: number
  cleaning_fee: number
  service_fee: number
  total_amount: number
  host_payout: number
  status: "pending" | "accepted" | "declined" | "cancelled_by_guest" | "cancelled_by_host" | "completed" | "cancelled"
  payment_status: string
  guest_message: string | null
  created_at: string
  // Relations
  listing?: {
    title: string
    photos: { url: string }[]
    city: string
    property_type: string
  }
  guest?: {
    id: string
    email: string
  }
}

// ===== HELPER: Get current host =====
async function getCurrentHost() {
  const { hostId, error } = await ensureHostExists()
  if (error || !hostId) {
    return null
  }
  return hostId
}

// ===== LISTINGS =====

export async function getHostListings(status?: "draft" | "published" | "archived") {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", listings: [] }
  }

  let query = supabase
    .from("listings")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false })

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

export async function getListingById(id: string) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", listing: null }
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("host_id", hostId)
    .single()

  if (error) {
    console.error("Error fetching listing:", error)
    return { success: false, error: error.message, listing: null }
  }

  return { success: true, listing: listing as HostListing | null }
}

export async function createListing(data: ListingInput, status: "draft" | "published") {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Vous devez être connecté pour créer une annonce" }
  }

  // Générer un titre par défaut si non fourni
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
  const defaultTitle = `${propertyTypeLabels[data.propertyType] || data.propertyType} à ${data.location.city}`

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      host_id: hostId,
      title: data.title || defaultTitle,
      description: data.description || "",
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
    })
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

export async function updateListing(
  id: string,
  data: ListingInput,
  status?: "draft" | "published" | "archived"
) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié" }
  }

  const updateData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    property_type: data.propertyType,
    country: data.location.country,
    street: data.location.street,
    city: data.location.city,
    state: data.location.state,
    zip: data.location.zip || null,
    latitude: data.location.coordinates?.lat ?? null,
    longitude: data.location.coordinates?.lng ?? null,
    bedrooms: data.details?.bedrooms,
    beds: data.details?.beds,
    bathrooms: data.details?.bathrooms,
    max_guests: data.details?.maxGuests,
    amenities: data.amenities,
    house_rules: data.houseRules,
    photos: data.photos,
    base_price: data.pricing.basePrice,
    weekend_price: data.pricing.weekendPrice,
    cleaning_fee: data.pricing.cleaningFee,
    additional_guest_fee: data.pricing.additionalGuestFee,
    smart_pricing: data.pricing.smartPricing,
    min_stay: data.availability.minStay,
    max_stay: data.availability.maxStay,
    instant_book: data.availability.instantBook,
    blocked_dates: data.availability.blockedDates,
    cancellation_policy: data.cancellationPolicy,
    updated_at: new Date().toISOString(),
  }

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key]
    }
  })

  if (status) {
    updateData.status = status
    if (status === 'published') {
      updateData.published_at = new Date().toISOString()
    }
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .update(updateData)
    .eq("id", id)
    .eq("host_id", hostId)
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

export async function deleteListing(id: string) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié" }
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("host_id", hostId)

  if (error) {
    console.error("Error archiving listing:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/listings")
  return { success: true }
}

export async function toggleListingStatus(id: string, currentStatus: string) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié" }
  }

  const newStatus = currentStatus === "published" ? "draft" : "published"
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .update(updateData)
    .eq("id", id)
    .eq("host_id", hostId)
    .select()
    .single()

  if (error) {
    console.error("Error toggling listing status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/listings")
  return { success: true, listing }
}

// ===== BOOKINGS =====

export async function getHostBookings(status?: string) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", bookings: [] }
  }

  let query = supabase
    .from("bookings")
    .select(`
      *,
      listing:listings(title, photos, city, property_type),
      guest:auth.users(id, email)
    `)
    .eq("host_id", hostId)
    .order("created_at", { ascending: false })

  if (status) {
    query = query.eq("status", status)
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error("Error fetching host bookings:", error)
    return { success: false, error: error.message, bookings: [] }
  }

  return { success: true, bookings: (bookings as Booking[]) || [] }
}

export async function getBookingById(id: string) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", booking: null }
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      *,
      listing:listings(title, photos, city, property_type, street, country, check_in_instructions, access_code)
    `)
    .eq("id", id)
    .eq("host_id", hostId)
    .single()

  if (error) {
    console.error("Error fetching booking:", error)
    return { success: false, error: error.message, booking: null }
  }

  return { success: true, booking }
}

export async function updateBookingStatus(
  id: string,
  newStatus: "accepted" | "declined" | "cancelled_by_host"
) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié" }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === "accepted") {
    updateData.accepted_at = new Date().toISOString()
  } else if (newStatus === "cancelled_by_host") {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancelled_by = user?.id
  }

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", id)
    .eq("host_id", hostId)

  if (error) {
    console.error("Error updating booking status:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/bookings")
  return { success: true }
}

// ===== DASHBOARD STATS =====

export async function getDashboardStats() {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return {
      success: false,
      stats: {
        activeListings: 0,
        totalEarnings: 0,
        upcomingBookings: 0,
        pendingBookings: 0,
        occupancyRate: 0,
        totalBookings: 0,
        averageRating: 0,
      },
    }
  }

  // Get listings stats
  const { data: listings } = await supabase
    .from("listings")
    .select("id, status, base_price, average_rating")
    .eq("host_id", hostId)

  const activeListings = listings?.filter((l) => l.status === "published").length || 0
  const totalListings = listings?.length || 0

  // Get bookings stats
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, host_payout, check_in")
    .eq("host_id", hostId)

  const completedBookings = bookings?.filter((b) => b.status === "completed") || []
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.host_payout || 0), 0)

  const today = new Date().toISOString().split("T")[0]
  const upcomingBookings = bookings?.filter(
    (b) => b.status === "accepted" && b.check_in >= today
  ).length || 0

  const pendingBookings = bookings?.filter((b) => b.status === "pending").length || 0
  const totalBookings = bookings?.length || 0

  // Calculate average rating
  const ratingsSum = listings?.reduce((sum, l) => sum + (l.average_rating || 0), 0) || 0
  const ratedListings = listings?.filter((l) => l.average_rating > 0).length || 1
  const averageRating = ratingsSum / ratedListings

  // Calculate occupancy rate
  const occupancyRate = totalListings > 0
    ? Math.round((activeListings / totalListings) * 100)
    : 0

  return {
    success: true,
    stats: {
      activeListings,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      upcomingBookings,
      pendingBookings,
      occupancyRate,
      totalBookings,
      averageRating: Math.round(averageRating * 10) / 10,
    },
  }
}

// ===== EARNINGS =====

export async function getEarningsOverview(period: "week" | "month" | "year" = "month") {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", data: null }
  }

  const now = new Date()
  let startDate: Date

  switch (period) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7))
      break
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1))
      break
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1))
      break
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("total_amount, service_fee, host_payout, created_at, status")
    .eq("host_id", hostId)
    .eq("status", "completed")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching earnings:", error)
    return { success: false, error: error.message, data: null }
  }

  const totalGross = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
  const totalFees = bookings?.reduce((sum, b) => sum + (b.service_fee || 0), 0) || 0
  const totalNet = bookings?.reduce((sum, b) => sum + (b.host_payout || 0), 0) || 0

  return {
    success: true,
    data: {
      totalGross,
      totalFees,
      totalNet,
      bookingsCount: bookings?.length || 0,
      bookings,
    },
  }
}

// ===== PAYOUTS =====

export async function getPayoutHistory() {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", payouts: [] }
  }

  const { data: payouts, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("host_id", hostId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching payouts:", error)
    return { success: false, error: error.message, payouts: [] }
  }

  return { success: true, payouts }
}

// ===== MESSAGES =====

export async function getConversations() {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", conversations: [] }
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select(`
      *,
      listing:listings(title, photos)
    `)
    .eq("host_id", hostId)
    .eq("status", "active")
    .order("last_message_at", { ascending: false })

  if (error) {
    console.error("Error fetching conversations:", error)
    return { success: false, error: error.message, conversations: [] }
  }

  return { success: true, conversations }
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", messages: [] }
  }

  // Verify host owns this conversation
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, host_id")
    .eq("id", conversationId)
    .eq("host_id", hostId)
    .single()

  if (!conversation) {
    return { success: false, error: "Conversation non trouvée", messages: [] }
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return { success: false, error: error.message, messages: [] }
  }

  // Mark messages as read
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("recipient_id", user.id)
      .is("read_at", null)

    // Reset unread count
    await supabase
      .from("conversations")
      .update({ host_unread_count: 0 })
      .eq("id", conversationId)
  }

  return { success: true, messages }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Non authentifié" }
  }

  // Get conversation to find recipient
  const { data: conversation } = await supabase
    .from("conversations")
    .select("guest_id")
    .eq("id", conversationId)
    .single()

  if (!conversation) {
    return { success: false, error: "Conversation non trouvée" }
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: conversation.guest_id,
      message_text: content,
    })
    .select()
    .single()

  if (error) {
    console.error("Error sending message:", error)
    return { success: false, error: error.message }
  }

  // Update conversation
  await supabase
    .from("conversations")
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.substring(0, 100),
      guest_unread_count: supabase.rpc('increment', { x: 1 })
    })
    .eq("id", conversationId)

  revalidatePath(`/dashboard/messages/${conversationId}`)
  return { success: true, message }
}

// ===== REVIEWS =====

export async function getHostReviews() {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié", reviews: [] }
  }

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(`
      *,
      listing:listings(title, city),
      booking:bookings(check_in, check_out)
    `)
    .eq("host_id", hostId)
    .eq("review_type", "guest_to_host")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reviews:", error)
    return { success: false, error: error.message, reviews: [] }
  }

  return { success: true, reviews }
}

export async function respondToReview(reviewId: string, response: string) {
  const supabase = await createClient()
  const hostId = await getCurrentHost()

  if (!hostId) {
    return { success: false, error: "Non authentifié" }
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      host_response: response,
      host_response_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("host_id", hostId)

  if (error) {
    console.error("Error responding to review:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/reviews")
  return { success: true }
}
