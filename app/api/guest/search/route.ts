import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchFiltersSchema, searchSortSchema } from "@/lib/validations/guest"
import type { ListingSearchResult, SearchResult } from "@/lib/types/guest"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const sort = searchSortSchema.safeParse(searchParams.get("sort") || "relevance")
    const sortValue = sort.success ? sort.data : "relevance"

    // Parse filters
    const filtersRaw: Record<string, unknown> = {}
    
    if (searchParams.get("location")) filtersRaw.location = searchParams.get("location")
    if (searchParams.get("latitude")) filtersRaw.latitude = parseFloat(searchParams.get("latitude")!)
    if (searchParams.get("longitude")) filtersRaw.longitude = parseFloat(searchParams.get("longitude")!)
    if (searchParams.get("radius_km")) filtersRaw.radius_km = parseFloat(searchParams.get("radius_km")!)
    if (searchParams.get("check_in")) filtersRaw.check_in = searchParams.get("check_in")
    if (searchParams.get("check_out")) filtersRaw.check_out = searchParams.get("check_out")
    if (searchParams.get("num_guests")) filtersRaw.num_guests = parseInt(searchParams.get("num_guests")!)
    if (searchParams.get("min_price")) filtersRaw.min_price = parseFloat(searchParams.get("min_price")!)
    if (searchParams.get("max_price")) filtersRaw.max_price = parseFloat(searchParams.get("max_price")!)
    if (searchParams.get("property_types")) filtersRaw.property_types = searchParams.get("property_types")?.split(",")
    if (searchParams.get("amenities")) filtersRaw.amenities = searchParams.get("amenities")?.split(",")
    if (searchParams.get("min_bedrooms")) filtersRaw.min_bedrooms = parseInt(searchParams.get("min_bedrooms")!)
    if (searchParams.get("min_beds")) filtersRaw.min_beds = parseInt(searchParams.get("min_beds")!)
    if (searchParams.get("min_bathrooms")) filtersRaw.min_bathrooms = parseInt(searchParams.get("min_bathrooms")!)
    if (searchParams.get("instant_book")) filtersRaw.instant_book = searchParams.get("instant_book") === "true"
    if (searchParams.get("superhost")) filtersRaw.superhost = searchParams.get("superhost") === "true"
    if (searchParams.get("min_rating")) filtersRaw.min_rating = parseFloat(searchParams.get("min_rating")!)

    const filters = searchFiltersSchema.safeParse(filtersRaw)
    const validFilters = filters.success ? filters.data : {}

    // Build the query
    let query = supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        property_type,
        city,
        state,
        country,
        latitude,
        longitude,
        photos,
        base_price,
        cleaning_fee,
        bedrooms,
        beds,
        bathrooms,
        max_guests,
        amenities,
        average_rating,
        reviews_count,
        instant_book,
        host:hosts(
          id,
          first_name,
          profile_picture_url,
          superhost
        )
      `, { count: "exact" })
      .eq("status", "published")

    // Apply filters
    if (validFilters.location) {
      query = query.or(`city.ilike.%${validFilters.location}%,state.ilike.%${validFilters.location}%,country.ilike.%${validFilters.location}%`)
    }

    if (validFilters.num_guests) {
      query = query.gte("max_guests", validFilters.num_guests)
    }

    if (validFilters.min_price !== undefined) {
      query = query.gte("base_price", validFilters.min_price)
    }

    if (validFilters.max_price !== undefined) {
      query = query.lte("base_price", validFilters.max_price)
    }

    if (validFilters.property_types && validFilters.property_types.length > 0) {
      query = query.in("property_type", validFilters.property_types)
    }

    if (validFilters.amenities && validFilters.amenities.length > 0) {
      query = query.contains("amenities", validFilters.amenities)
    }

    if (validFilters.min_bedrooms !== undefined) {
      query = query.gte("bedrooms", validFilters.min_bedrooms)
    }

    if (validFilters.min_beds !== undefined) {
      query = query.gte("beds", validFilters.min_beds)
    }

    if (validFilters.min_bathrooms !== undefined) {
      query = query.gte("bathrooms", validFilters.min_bathrooms)
    }

    if (validFilters.instant_book !== undefined) {
      query = query.eq("instant_book", validFilters.instant_book)
    }

    if (validFilters.min_rating !== undefined) {
      query = query.gte("average_rating", validFilters.min_rating)
    }

    // Apply sorting
    switch (sortValue) {
      case "price_asc":
        query = query.order("base_price", { ascending: true })
        break
      case "price_desc":
        query = query.order("base_price", { ascending: false })
        break
      case "rating":
        query = query.order("average_rating", { ascending: false, nullsFirst: false })
        break
      case "reviews":
        query = query.order("reviews_count", { ascending: false })
        break
      case "newest":
        query = query.order("created_at", { ascending: false })
        break
      default:
        // relevance - prioritize higher ratings and more reviews
        query = query.order("average_rating", { ascending: false, nullsFirst: false })
        query = query.order("reviews_count", { ascending: false })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: listings, error, count } = await query

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to search listings" },
        { status: 500 }
      )
    }

    // Post-process for geo filtering if coordinates provided
    let processedListings = listings as ListingSearchResult[]

    if (validFilters.latitude && validFilters.longitude) {
      const radiusKm = validFilters.radius_km || 50
      
      processedListings = processedListings
        .map(listing => {
          if (!listing.latitude || !listing.longitude) {
            return { ...listing, distance_km: undefined }
          }
          
          const distance = calculateDistance(
            validFilters.latitude!,
            validFilters.longitude!,
            listing.latitude,
            listing.longitude
          )
          
          return { ...listing, distance_km: Math.round(distance * 10) / 10 }
        })
        .filter(listing => {
          if (listing.distance_km === undefined) return true
          return listing.distance_km <= radiusKm
        })

      // Sort by distance if geo search
      if (sortValue === "distance" || sortValue === "relevance") {
        processedListings.sort((a, b) => {
          if (a.distance_km === undefined) return 1
          if (b.distance_km === undefined) return -1
          return a.distance_km - b.distance_km
        })
      }
    }

    // Check availability if dates provided
    if (validFilters.check_in && validFilters.check_out) {
      const listingIds = processedListings.map(l => l.id)
      
      // Get bookings that overlap with the requested dates
      const { data: conflictingBookings } = await supabase
        .from("bookings")
        .select("listing_id")
        .in("listing_id", listingIds)
        .in("status", ["pending", "accepted", "confirmed"])
        .or(`and(check_in.lte.${validFilters.check_out},check_out.gte.${validFilters.check_in})`)

      if (conflictingBookings) {
        const unavailableIds = new Set(conflictingBookings.map(b => b.listing_id))
        processedListings = processedListings.filter(l => !unavailableIds.has(l.id))
      }
    }

    // Filter by superhost if requested
    if (validFilters.superhost) {
      processedListings = processedListings.filter(l => l.host?.superhost === true)
    }

    const total = count || processedListings.length
    const hasMore = offset + processedListings.length < total

    // Save search history for logged-in users
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("search_history").insert({
        user_id: user.id,
        search_query: validFilters.location,
        location: validFilters.location,
        latitude: validFilters.latitude,
        longitude: validFilters.longitude,
        check_in: validFilters.check_in,
        check_out: validFilters.check_out,
        num_guests: validFilters.num_guests,
        filters: validFilters,
        results_count: processedListings.length,
      })
    }

    const response: SearchResult = {
      listings: processedListings,
      total,
      page,
      limit,
      has_more: hasMore,
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
