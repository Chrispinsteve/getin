"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { GuestDashboardStats } from "@/lib/types/guest"

// ===== HELPER: Get current user =====
async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// ===== DASHBOARD STATS =====
export async function getGuestDashboardStats(): Promise<{
  success: boolean
  stats: GuestDashboardStats | null
  error?: string
}> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, stats: null, error: "Non authentifié" }
  }

  // Get bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, total_amount, nights, check_in, listing:listings(city, country)")
    .eq("guest_id", user.id)

  // Get favorites count
  const { count: favoritesCount } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Get reviews written
  const { data: reviews } = await supabase
    .from("reviews")
    .select("overall_rating")
    .eq("reviewer_id", user.id)
    .eq("review_type", "guest_to_host")

  // Get analytics
  const { data: analytics } = await supabase
    .from("guest_analytics")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Calculate stats
  const completedBookings = bookings?.filter(b => b.status === "completed") || []
  const upcomingBookings = bookings?.filter(b => 
    ["pending", "accepted", "confirmed"].includes(b.status) && 
    new Date(b.check_in) >= new Date()
  ) || []

  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
  const nightsStayed = completedBookings.reduce((sum, b) => sum + (b.nights || 0), 0)

  // Unique locations
  const cities = new Set(completedBookings.map(b => b.listing?.city).filter(Boolean))
  const countries = new Set(completedBookings.map(b => b.listing?.country).filter(Boolean))

  // Average rating given
  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
    : 0

  const stats: GuestDashboardStats = {
    total_trips: completedBookings.length,
    upcoming_trips: upcomingBookings.length,
    total_spent: Math.round(totalSpent * 100) / 100,
    nights_stayed: nightsStayed,
    countries_visited: countries.size,
    cities_visited: cities.size,
    average_rating_given: Math.round(avgRating * 10) / 10,
    reviews_written: reviews?.length || 0,
    favorites_count: favoritesCount || 0,
    loyalty_points: analytics?.loyalty_points || 0,
    loyalty_tier: analytics?.loyalty_tier || "bronze",
  }

  return { success: true, stats }
}

// ===== UPCOMING TRIPS =====
export async function getUpcomingTrips() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, trips: [], error: "Non authentifié" }
  }

  const today = new Date().toISOString().split("T")[0]

  const { data: trips, error } = await supabase
    .from("bookings")
    .select(`
      *,
      listing:listings(
        id,
        title,
        property_type,
        city,
        state,
        country,
        photos,
        latitude,
        longitude,
        check_in_instructions
      ),
      host:hosts!bookings_host_id_fkey(
        id,
        first_name,
        last_name,
        profile_picture_url,
        phone
      )
    `)
    .eq("guest_id", user.id)
    .in("status", ["pending", "accepted", "confirmed"])
    .gte("check_in", today)
    .order("check_in", { ascending: true })
    .limit(5)

  if (error) {
    console.error("Error fetching upcoming trips:", error)
    return { success: false, trips: [], error: error.message }
  }

  return { success: true, trips: trips || [] }
}

// ===== PAST TRIPS =====
export async function getPastTrips(page: number = 1, limit: number = 10) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, trips: [], total: 0, error: "Non authentifié" }
  }

  const today = new Date().toISOString().split("T")[0]
  const offset = (page - 1) * limit

  const { data: trips, error, count } = await supabase
    .from("bookings")
    .select(`
      *,
      listing:listings(id, title, city, photos),
      review:reviews(id, overall_rating)
    `, { count: "exact" })
    .eq("guest_id", user.id)
    .or(`status.eq.completed,and(check_out.lt.${today},status.in.(accepted,confirmed))`)
    .order("check_out", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching past trips:", error)
    return { success: false, trips: [], total: 0, error: error.message }
  }

  return { 
    success: true, 
    trips: trips || [], 
    total: count || 0,
    has_more: (offset + (trips?.length || 0)) < (count || 0)
  }
}

// ===== FAVORITES =====
export async function toggleFavorite(listingId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Non authentifié" }
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .single()

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/guest/favorites")
    return { success: true, action: "removed" }
  } else {
    // Add favorite
    const { error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        listing_id: listingId,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/guest/favorites")
    return { success: true, action: "added" }
  }
}

// ===== SEARCH HISTORY =====
export async function getSearchHistory(limit: number = 10) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, history: [], error: "Non authentifié" }
  }

  const { data: history, error } = await supabase
    .from("search_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching search history:", error)
    return { success: false, history: [], error: error.message }
  }

  return { success: true, history: history || [] }
}

export async function clearSearchHistory() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Non authentifié" }
  }

  const { error } = await supabase
    .from("search_history")
    .delete()
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ===== RECENTLY VIEWED =====
export async function getRecentlyViewed(limit: number = 10) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, listings: [], error: "Non authentifié" }
  }

  // Get recent views
  const { data: views, error } = await supabase
    .from("listing_views")
    .select(`
      listing_id,
      created_at,
      listing:listings(
        id,
        title,
        city,
        photos,
        base_price,
        average_rating
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit * 2) // Get more to filter duplicates

  if (error) {
    console.error("Error fetching recently viewed:", error)
    return { success: false, listings: [], error: error.message }
  }

  // Remove duplicates, keeping most recent
  const seen = new Set()
  const uniqueListings = views
    ?.filter(v => {
      if (seen.has(v.listing_id)) return false
      seen.add(v.listing_id)
      return v.listing !== null
    })
    .slice(0, limit)
    .map(v => ({
      ...v.listing,
      viewed_at: v.created_at,
    })) || []

  return { success: true, listings: uniqueListings }
}

// ===== NOTIFICATIONS =====
export async function getUnreadNotificationsCount() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, count: 0 }
  }

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  return { success: true, count: count || 0 }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: "Non authentifié" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/guest")
  return { success: true }
}

// ===== RECOMMENDATIONS =====
export async function getRecommendedListings(limit: number = 8) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  let preferences: { preferred_property_types?: string[]; preferred_amenities?: string[]; price_range_max?: number } | null = null

  if (user) {
    // Get user preferences
    const { data } = await supabase
      .from("guest_preferences")
      .select("preferred_property_types, preferred_amenities, price_range_max")
      .eq("user_id", user.id)
      .single()
    preferences = data
  }

  // Build query based on preferences or return popular listings
  let query = supabase
    .from("listings")
    .select(`
      id,
      title,
      city,
      state,
      country,
      photos,
      base_price,
      average_rating,
      reviews_count,
      instant_book,
      host:hosts(first_name, profile_picture_url, superhost)
    `)
    .eq("status", "published")
    .order("average_rating", { ascending: false, nullsFirst: false })
    .order("reviews_count", { ascending: false })

  if (preferences?.preferred_property_types?.length) {
    query = query.in("property_type", preferences.preferred_property_types)
  }

  if (preferences?.price_range_max) {
    query = query.lte("base_price", preferences.price_range_max)
  }

  const { data: listings, error } = await query.limit(limit)

  if (error) {
    console.error("Error fetching recommendations:", error)
    return { success: false, listings: [], error: error.message }
  }

  return { success: true, listings: listings || [] }
}
