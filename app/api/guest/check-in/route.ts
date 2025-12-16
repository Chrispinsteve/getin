import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { completeCheckInSchema } from "@/lib/validations/guest"

// GET - Get check-in details for a booking
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
    const bookingId = searchParams.get("booking_id")

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID required" },
        { status: 400 }
      )
    }

    // Get booking with check-in info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        check_in,
        check_out,
        status,
        listing:listings(
          id,
          title,
          street,
          city,
          state,
          country,
          latitude,
          longitude,
          check_in_instructions,
          access_code,
          wifi_password,
          house_rules,
          photos
        ),
        host:hosts!bookings_host_id_fkey(
          first_name,
          last_name,
          phone,
          profile_picture_url
        )
      `)
      .eq("id", bookingId)
      .eq("guest_id", user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Get check-in record if exists
    const { data: checkIn } = await supabase
      .from("check_ins")
      .select("*")
      .eq("booking_id", bookingId)
      .single()

    // Check if check-in is available (within 24 hours before check-in date)
    const checkInDate = new Date(booking.check_in)
    const now = new Date()
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const canCheckIn = booking.status === "confirmed" && 
                       hoursUntilCheckIn <= 24 && 
                       hoursUntilCheckIn > -24 && 
                       !checkIn?.actual_time

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: booking.id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          status: booking.status,
        },
        listing: booking.listing,
        host: booking.host,
        check_in_record: checkIn,
        can_check_in: canCheckIn,
        hours_until_check_in: Math.round(hoursUntilCheckIn),
      },
    })
  } catch (error) {
    console.error("Get check-in error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Initiate or complete check-in
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
    const action = body.action // 'initiate' or 'complete'

    const bookingId = body.booking_id
    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Booking ID required" },
        { status: 400 }
      )
    }

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        id,
        check_in,
        status,
        listing_id,
        listing:listings(
          id,
          check_in_instructions,
          access_code,
          house_rules,
          wifi_password,
          host:hosts(user_id)
        )
      `)
      .eq("id", bookingId)
      .eq("guest_id", user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { success: false, error: "Booking must be confirmed to check in" },
        { status: 400 }
      )
    }

    // Check timing
    const checkInDate = new Date(booking.check_in)
    const now = new Date()
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilCheckIn > 24) {
      return NextResponse.json(
        { success: false, error: "Check-in is only available 24 hours before arrival" },
        { status: 400 }
      )
    }

    if (action === "initiate") {
      // Check if already initiated
      const { data: existingCheckIn } = await supabase
        .from("check_ins")
        .select("id")
        .eq("booking_id", bookingId)
        .single()

      if (existingCheckIn) {
        return NextResponse.json(
          { success: false, error: "Check-in already initiated" },
          { status: 400 }
        )
      }

      // Create check-in record
      const { data: checkIn, error: createError } = await supabase
        .from("check_ins")
        .insert({
          booking_id: bookingId,
          guest_id: user.id,
          listing_id: booking.listing_id,
          check_in_type: "self",
          scheduled_time: booking.check_in,
          status: "in_progress",
          access_code: booking.listing?.access_code,
          access_instructions: booking.listing?.check_in_instructions,
          wifi_credentials: booking.listing?.wifi_password 
            ? { network_name: "WiFi", password: booking.listing.wifi_password }
            : null,
        })
        .select()
        .single()

      if (createError) {
        console.error("Error creating check-in:", createError)
        return NextResponse.json(
          { success: false, error: "Failed to initiate check-in" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          check_in: checkIn,
          access_instructions: booking.listing?.check_in_instructions,
          access_code: booking.listing?.access_code,
          house_rules: booking.listing?.house_rules,
        },
      })
    }

    if (action === "complete") {
      const validation = completeCheckInSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const data = validation.data

      // Get existing check-in
      const { data: checkIn } = await supabase
        .from("check_ins")
        .select("*")
        .eq("booking_id", bookingId)
        .single()

      if (!checkIn) {
        return NextResponse.json(
          { success: false, error: "Check-in not initiated" },
          { status: 400 }
        )
      }

      if (checkIn.status === "completed") {
        return NextResponse.json(
          { success: false, error: "Already checked in" },
          { status: 400 }
        )
      }

      // Update check-in record
      const { data: updatedCheckIn, error: updateError } = await supabase
        .from("check_ins")
        .update({
          actual_time: new Date().toISOString(),
          status: "completed",
          property_photos: data.property_photos || [],
          guest_acknowledged_rules: data.guest_acknowledged_rules,
          issues_reported: data.issues_reported,
          completed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkIn.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error completing check-in:", updateError)
        return NextResponse.json(
          { success: false, error: "Failed to complete check-in" },
          { status: 500 }
        )
      }

      // Create check-out record
      await supabase.from("check_outs").insert({
        booking_id: bookingId,
        check_in_id: checkIn.id,
        guest_id: user.id,
        listing_id: booking.listing_id,
        scheduled_time: booking.listing?.check_out || booking.check_out,
        status: "pending",
      })

      // Notify host
      await supabase.from("notifications").insert({
        user_id: booking.listing?.host?.user_id,
        type: "check_in_reminder",
        title: "Guest checked in",
        message: `Your guest has checked in to their booking`,
        data: { booking_id: bookingId, check_in_id: checkIn.id },
        action_url: `/dashboard/bookings/${bookingId}`,
      })

      return NextResponse.json({
        success: true,
        data: updatedCheckIn,
        message: "Check-in completed successfully",
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
