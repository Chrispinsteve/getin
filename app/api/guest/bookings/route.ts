import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createBookingSchema, cancelBookingSchema } from "@/lib/validations/guest"

// GET - List guest bookings
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
    const status = searchParams.get("status")
    const type = searchParams.get("type") // upcoming, past, all
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))

    let query = supabase
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
          base_price,
          latitude,
          longitude,
          check_in_instructions,
          house_rules
        ),
        host:hosts!bookings_host_id_fkey(
          id,
          first_name,
          last_name,
          profile_picture_url,
          phone,
          superhost
        )
      `, { count: "exact" })
      .eq("guest_id", user.id)
      .order("check_in", { ascending: false })

    // Filter by status
    if (status) {
      query = query.eq("status", status)
    }

    // Filter by type (upcoming/past)
    const today = new Date().toISOString().split("T")[0]
    if (type === "upcoming") {
      query = query.gte("check_in", today)
      query = query.in("status", ["pending", "accepted", "confirmed"])
      query = query.order("check_in", { ascending: true })
    } else if (type === "past") {
      query = query.lt("check_out", today)
    }

    // Pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: bookings, error, count } = await query

    if (error) {
      console.error("Error fetching bookings:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch bookings" },
        { status: 500 }
      )
    }

    // Get check-in/out records and reviews for each booking
    const bookingIds = bookings?.map(b => b.id) || []
    
    const [checkIns, checkOuts, reviews] = await Promise.all([
      supabase
        .from("check_ins")
        .select("*")
        .in("booking_id", bookingIds),
      supabase
        .from("check_outs")
        .select("*")
        .in("booking_id", bookingIds),
      supabase
        .from("reviews")
        .select("id, overall_rating, review_text, created_at")
        .in("booking_id", bookingIds)
        .eq("reviewer_id", user.id)
    ])

    // Merge additional data
    const enrichedBookings = bookings?.map(booking => ({
      ...booking,
      check_in_record: checkIns.data?.find(ci => ci.booking_id === booking.id) || null,
      check_out_record: checkOuts.data?.find(co => co.booking_id === booking.id) || null,
      guest_review: reviews.data?.find(r => r.booking_id === booking.id) || null,
    }))

    return NextResponse.json({
      success: true,
      data: enrichedBookings,
      total: count || 0,
      page,
      limit,
      has_more: (offset + (bookings?.length || 0)) < (count || 0),
    })
  } catch (error) {
    console.error("Bookings fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new booking
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
    const validation = createBookingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select(`
        *,
        host:hosts(id, user_id, first_name, last_name)
      `)
      .eq("id", data.listing_id)
      .eq("status", "published")
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found or not available" },
        { status: 404 }
      )
    }

    // Check if guest is trying to book their own listing
    if (listing.host?.user_id === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot book your own listing" },
        { status: 400 }
      )
    }

    // Check availability
    const checkInDate = new Date(data.check_in)
    const checkOutDate = new Date(data.check_out)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Validate min/max stay
    if (listing.min_stay && nights < listing.min_stay) {
      return NextResponse.json(
        { success: false, error: `Minimum stay is ${listing.min_stay} nights` },
        { status: 400 }
      )
    }

    if (listing.max_stay && nights > listing.max_stay) {
      return NextResponse.json(
        { success: false, error: `Maximum stay is ${listing.max_stay} nights` },
        { status: 400 }
      )
    }

    // Check guest capacity
    if (data.num_guests > listing.max_guests) {
      return NextResponse.json(
        { success: false, error: `Maximum ${listing.max_guests} guests allowed` },
        { status: 400 }
      )
    }

    // Check for conflicting bookings
    const { data: conflicting } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", data.listing_id)
      .in("status", ["pending", "accepted", "confirmed"])
      .or(`and(check_in.lt.${data.check_out},check_out.gt.${data.check_in})`)

    if (conflicting && conflicting.length > 0) {
      return NextResponse.json(
        { success: false, error: "These dates are not available" },
        { status: 400 }
      )
    }

    // Calculate pricing
    const { data: pricing } = await supabase.rpc("calculate_booking_price", {
      p_listing_id: data.listing_id,
      p_check_in: data.check_in,
      p_check_out: data.check_out,
      p_num_guests: data.num_guests,
      p_promo_code: data.promo_code || null,
    })

    const priceData = pricing?.[0] || {
      nights,
      base_price_per_night: listing.base_price,
      total_nights_cost: listing.base_price * nights,
      cleaning_fee: listing.cleaning_fee || 0,
      service_fee: Math.round((listing.base_price * nights + (listing.cleaning_fee || 0)) * 0.10),
      tax_amount: Math.round((listing.base_price * nights + (listing.cleaning_fee || 0)) * 0.10),
      discount_amount: 0,
      total_amount: 0,
      host_payout: 0,
    }

    // Calculate total if not from function
    if (!priceData.total_amount) {
      priceData.total_amount = priceData.total_nights_cost + priceData.cleaning_fee + 
        priceData.service_fee + priceData.tax_amount - priceData.discount_amount
      priceData.host_payout = priceData.total_nights_cost + priceData.cleaning_fee - 
        (priceData.total_nights_cost * 0.03)
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()

    // Create the booking
    const bookingData = {
      listing_id: data.listing_id,
      guest_id: user.id,
      host_id: listing.host.id,
      check_in: data.check_in,
      check_out: data.check_out,
      nights: priceData.nights,
      num_guests: data.num_guests,
      num_adults: data.num_adults || data.num_guests,
      num_children: data.num_children || 0,
      num_infants: data.num_infants || 0,
      num_pets: data.num_pets || 0,
      base_price_per_night: priceData.base_price_per_night,
      total_nights_cost: priceData.total_nights_cost,
      cleaning_fee: priceData.cleaning_fee,
      service_fee: priceData.service_fee,
      tax_amount: priceData.tax_amount,
      discount_amount: priceData.discount_amount,
      total_amount: priceData.total_amount,
      host_payout: priceData.host_payout,
      currency: "HTG",
      status: listing.instant_book ? "confirmed" : "pending",
      payment_status: "pending",
      payment_method: data.payment_method,
      guest_message: data.guest_message || null,
      special_requests: data.special_requests || null,
      promo_code: data.promo_code || null,
      is_instant_book: listing.instant_book,
      guest_name: profile?.full_name || user.email?.split("@")[0] || "Guest",
      guest_email: user.email,
      guest_phone: profile?.phone || null,
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert(bookingData)
      .select()
      .single()

    if (bookingError) {
      console.error("Error creating booking:", bookingError)
      return NextResponse.json(
        { success: false, error: "Failed to create booking" },
        { status: 500 }
      )
    }

    // Record promo code usage if applicable
    if (data.promo_code && priceData.discount_amount > 0) {
      await supabase.from("promo_code_usage").insert({
        promo_code_id: (await supabase.from("promo_codes").select("id").eq("code", data.promo_code.toUpperCase()).single()).data?.id,
        user_id: user.id,
        booking_id: booking.id,
        discount_applied: priceData.discount_amount,
      })

      // Increment usage count
      await supabase.rpc("increment_promo_usage", { p_code: data.promo_code.toUpperCase() })
    }

    // Create notification for host
    await supabase.from("notifications").insert({
      user_id: listing.host.user_id,
      type: listing.instant_book ? "booking_confirmed" : "booking_request",
      title: listing.instant_book ? "Nouvelle réservation confirmée" : "Nouvelle demande de réservation",
      message: `${profile?.full_name || "Un voyageur"} ${listing.instant_book ? "a réservé" : "souhaite réserver"} ${listing.title} du ${data.check_in} au ${data.check_out}`,
      data: { booking_id: booking.id, listing_id: listing.id },
      action_url: `/dashboard/bookings/${booking.id}`,
    })

    // Create or get conversation
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", data.listing_id)
      .eq("guest_id", user.id)
      .eq("host_id", listing.host.id)
      .single()

    let conversationId = existingConversation?.id

    if (!conversationId) {
      const { data: newConversation } = await supabase
        .from("conversations")
        .insert({
          listing_id: data.listing_id,
          booking_id: booking.id,
          host_id: listing.host.id,
          guest_id: user.id,
          conversation_type: "booking",
          subject: `Réservation: ${listing.title}`,
        })
        .select("id")
        .single()
      conversationId = newConversation?.id
    } else {
      // Update existing conversation with booking
      await supabase
        .from("conversations")
        .update({ booking_id: booking.id })
        .eq("id", conversationId)
    }

    // Send system message for booking
    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: listing.host.user_id,
        message_type: listing.instant_book ? "booking_confirmation" : "booking_request",
        message_text: data.guest_message || `${listing.instant_book ? "Réservation confirmée" : "Demande de réservation"} pour ${nights} nuit(s), du ${data.check_in} au ${data.check_out}`,
        metadata: { booking_id: booking.id },
      })

      // Update conversation
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: data.guest_message || "Nouvelle réservation",
          host_unread_count: 1,
        })
        .eq("id", conversationId)
    }

    return NextResponse.json({
      success: true,
      data: {
        booking,
        conversation_id: conversationId,
        requires_payment: true,
        payment_method: data.payment_method,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Booking creation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
