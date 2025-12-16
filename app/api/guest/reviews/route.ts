import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createReviewSchema } from "@/lib/validations/guest"

// GET - List guest's reviews
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'written' or 'received'

    let query = supabase
      .from("reviews")
      .select(`
        *,
        listing:listings(
          id,
          title,
          city,
          photos
        ),
        booking:bookings(
          id,
          check_in,
          check_out
        )
      `)
      .order("created_at", { ascending: false })

    if (type === "received") {
      // Reviews received by the guest (host reviews about them)
      query = query
        .eq("reviewee_id", user.id)
        .eq("review_type", "host_to_guest")
    } else {
      // Reviews written by the guest
      query = query
        .eq("reviewer_id", user.id)
        .eq("review_type", "guest_to_host")
    }

    const { data: reviews, error } = await query

    if (error) {
      console.error("Error fetching reviews:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch reviews" },
        { status: 500 }
      )
    }

    // Get bookings eligible for review (completed, not yet reviewed)
    const { data: eligibleBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        check_in,
        check_out,
        listing:listings(id, title, city, photos)
      `)
      .eq("guest_id", user.id)
      .eq("status", "completed")
      .not("id", "in", `(${reviews?.filter(r => r.review_type === "guest_to_host").map(r => r.booking_id).join(",") || "''"})`)
      .order("check_out", { ascending: false })

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pending_reviews: eligibleBookings || [],
      },
    })
  } catch (error) {
    console.error("Reviews error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = createReviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get booking with listing and host info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        guest_id,
        listing_id,
        host_id,
        status,
        listing:listings(title, host:hosts(user_id))
      `)
      .eq("id", data.booking_id)
      .eq("guest_id", user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Can only review completed bookings" },
        { status: 400 }
      )
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", data.booking_id)
      .eq("reviewer_id", user.id)
      .eq("review_type", "guest_to_host")
      .single()

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this booking" },
        { status: 400 }
      )
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        booking_id: data.booking_id,
        listing_id: booking.listing_id,
        host_id: booking.host_id,
        reviewer_id: user.id,
        reviewee_id: booking.listing?.host?.user_id,
        review_type: "guest_to_host",
        overall_rating: data.overall_rating,
        cleanliness_rating: data.cleanliness_rating,
        accuracy_rating: data.accuracy_rating,
        communication_rating: data.communication_rating,
        location_rating: data.location_rating,
        check_in_rating: data.check_in_rating,
        value_rating: data.value_rating,
        review_text: data.review_text,
        private_feedback: data.private_feedback,
        photos: data.photos,
        status: "published",
      })
      .select()
      .single()

    if (reviewError) {
      console.error("Error creating review:", reviewError)
      return NextResponse.json(
        { success: false, error: "Failed to create review" },
        { status: 500 }
      )
    }

    // Create notification for host
    await supabase.from("notifications").insert({
      user_id: booking.listing?.host?.user_id,
      type: "review_received",
      title: "Nouvel avis reçu",
      message: `Vous avez reçu un avis ${data.overall_rating} étoiles pour ${booking.listing?.title}`,
      data: { review_id: review.id, listing_id: booking.listing_id },
      action_url: `/dashboard/reviews`,
    })

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error) {
    console.error("Create review error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update a review (within 48 hours)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { review_id, ...updateData } = body

    if (!review_id) {
      return NextResponse.json(
        { success: false, error: "Review ID required" },
        { status: 400 }
      )
    }

    // Get the review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", review_id)
      .eq("reviewer_id", user.id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      )
    }

    // Check if within 48 hours
    const createdAt = new Date(review.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 48) {
      return NextResponse.json(
        { success: false, error: "Reviews can only be edited within 48 hours" },
        { status: 400 }
      )
    }

    // Update the review
    const allowedFields = [
      "overall_rating",
      "cleanliness_rating",
      "accuracy_rating",
      "communication_rating",
      "location_rating",
      "check_in_rating",
      "value_rating",
      "review_text",
      "private_feedback",
      "photos",
    ]

    const filteredUpdate: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field]
      }
    }

    const { data: updatedReview, error: updateError } = await supabase
      .from("reviews")
      .update({ ...filteredUpdate, updated_at: new Date().toISOString() })
      .eq("id", review_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating review:", updateError)
      return NextResponse.json(
        { success: false, error: "Failed to update review" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updatedReview })
  } catch (error) {
    console.error("Update review error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
