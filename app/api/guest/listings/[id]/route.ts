import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch the listing with all related data
    const { data: listing, error } = await supabase
      .from("listings")
      .select(`
        *,
        host:hosts(
          id,
          user_id,
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
      .eq("id", id)
      .eq("status", "published")
      .single()

    if (error || !listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      )
    }

    // Fetch reviews for this listing
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
        photos,
        host_response,
        host_response_at,
        created_at,
        reviewer:profiles!reviewer_id(
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("listing_id", id)
      .eq("review_type", "guest_to_host")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10)

    // Calculate review stats
    const { data: reviewStats } = await supabase
      .from("reviews")
      .select("overall_rating, cleanliness_rating, accuracy_rating, communication_rating, location_rating, check_in_rating, value_rating")
      .eq("listing_id", id)
      .eq("review_type", "guest_to_host")
      .eq("status", "published")

    let stats = null
    if (reviewStats && reviewStats.length > 0) {
      const avg = (arr: (number | null)[]) => {
        const valid = arr.filter((n): n is number => n !== null)
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null
      }

      const distribution = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }
      reviewStats.forEach(r => {
        const key = Math.floor(r.overall_rating).toString() as keyof typeof distribution
        if (key in distribution) distribution[key]++
      })

      stats = {
        average_rating: avg(reviewStats.map(r => r.overall_rating)),
        total_reviews: reviewStats.length,
        cleanliness_average: avg(reviewStats.map(r => r.cleanliness_rating)),
        accuracy_average: avg(reviewStats.map(r => r.accuracy_rating)),
        communication_average: avg(reviewStats.map(r => r.communication_rating)),
        location_average: avg(reviewStats.map(r => r.location_rating)),
        check_in_average: avg(reviewStats.map(r => r.check_in_rating)),
        value_average: avg(reviewStats.map(r => r.value_rating)),
        rating_distribution: distribution,
      }
    }

    // Check if user has favorited this listing
    let isFavorited = false
    if (user) {
      const { data: favorite } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", id)
        .single()
      isFavorited = !!favorite
    }

    // Get similar listings
    const { data: similarListings } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        city,
        photos,
        base_price,
        average_rating,
        reviews_count
      `)
      .eq("status", "published")
      .eq("city", listing.city)
      .neq("id", id)
      .limit(4)

    // Record the view
    const sessionId = request.headers.get("x-session-id") || crypto.randomUUID()
    const deviceType = detectDeviceType(request.headers.get("user-agent") || "")
    const referrer = request.headers.get("referer")
    const source = detectSource(referrer, request.url)

    await supabase.from("listing_views").insert({
      listing_id: id,
      user_id: user?.id || null,
      session_id: sessionId,
      device_type: deviceType,
      source: source,
      referrer: referrer,
    })

    // Increment view count
    await supabase
      .from("listings")
      .update({ views_count: (listing.views_count || 0) + 1 })
      .eq("id", id)

    return NextResponse.json({
      success: true,
      data: {
        ...listing,
        reviews: reviews || [],
        review_stats: stats,
        is_favorited: isFavorited,
        similar_listings: similarListings || [],
      },
    })
  } catch (error) {
    console.error("Error fetching listing:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

function detectDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" {
  const ua = userAgent.toLowerCase()
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet"
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile"
  return "desktop"
}

function detectSource(referrer: string | null, url: string): "search" | "direct" | "favorites" | "recommendation" | "share" | "map" {
  if (!referrer) return "direct"
  
  if (referrer.includes("/search") || referrer.includes("/listings")) return "search"
  if (referrer.includes("/favorites") || referrer.includes("/wishlist")) return "favorites"
  if (referrer.includes("/recommendations")) return "recommendation"
  if (referrer.includes("/map")) return "map"
  
  // Check if coming from external source (share)
  const referrerHost = new URL(referrer).hostname
  const currentHost = new URL(url).hostname
  if (referrerHost !== currentHost) return "share"
  
  return "direct"
}
