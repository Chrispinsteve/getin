import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { completeCheckOutSchema, requestLateCheckoutSchema } from "@/lib/validations/guest"

// GET - Get check-out details
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

    // Get check-out record
    const { data: checkOut, error } = await supabase
      .from("check_outs")
      .select(`
        *,
        check_in:check_ins(
          actual_time,
          property_photos
        )
      `)
      .eq("booking_id", bookingId)
      .eq("guest_id", user.id)
      .single()

    if (error || !checkOut) {
      return NextResponse.json(
        { success: false, error: "Check-out record not found" },
        { status: 404 }
      )
    }

    // Get booking details
    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        check_out,
        listing:listings(
          title,
          checkout_instructions
        )
      `)
      .eq("id", bookingId)
      .single()

    const checkOutDate = new Date(booking?.check_out || checkOut.scheduled_time)
    const now = new Date()
    const hoursUntilCheckOut = (checkOutDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    return NextResponse.json({
      success: true,
      data: {
        check_out: checkOut,
        booking: {
          check_out_date: booking?.check_out,
        },
        listing: booking?.listing,
        hours_until_check_out: Math.round(hoursUntilCheckOut),
        can_request_late_checkout: hoursUntilCheckOut > 12 && hoursUntilCheckOut < 48,
      },
    })
  } catch (error) {
    console.error("Get check-out error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Complete check-out or request late checkout
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
    const action = body.action // 'complete' or 'request_late'

    if (action === "request_late") {
      const validation = requestLateCheckoutSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const data = validation.data

      // Get check-out record
      const { data: checkOut } = await supabase
        .from("check_outs")
        .select("*, booking:bookings(host_id, listing:listings(host:hosts(user_id)))")
        .eq("booking_id", data.booking_id)
        .eq("guest_id", user.id)
        .single()

      if (!checkOut) {
        return NextResponse.json(
          { success: false, error: "Check-out record not found" },
          { status: 404 }
        )
      }

      // Update check-out with late request
      const { error: updateError } = await supabase
        .from("check_outs")
        .update({
          status: "extended",
          scheduled_time: data.requested_time,
          guest_feedback: data.reason,
          late_checkout_approved: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkOut.id)

      if (updateError) {
        console.error("Error requesting late checkout:", updateError)
        return NextResponse.json(
          { success: false, error: "Failed to request late checkout" },
          { status: 500 }
        )
      }

      // Notify host
      await supabase.from("notifications").insert({
        user_id: checkOut.booking?.listing?.host?.user_id,
        type: "check_out_reminder",
        title: "Late checkout request",
        message: `Your guest has requested a late checkout`,
        data: { booking_id: data.booking_id },
        action_url: `/dashboard/bookings/${data.booking_id}`,
      })

      return NextResponse.json({
        success: true,
        message: "Late checkout request submitted. Waiting for host approval.",
      })
    }

    if (action === "complete") {
      const validation = completeCheckOutSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const data = validation.data

      // Get check-out record
      const { data: checkOut } = await supabase
        .from("check_outs")
        .select("*, booking:bookings(id, host_id, listing:listings(host:hosts(user_id)))")
        .eq("booking_id", data.booking_id)
        .eq("guest_id", user.id)
        .single()

      if (!checkOut) {
        return NextResponse.json(
          { success: false, error: "Check-out record not found" },
          { status: 404 }
        )
      }

      if (checkOut.status === "completed") {
        return NextResponse.json(
          { success: false, error: "Already checked out" },
          { status: 400 }
        )
      }

      // Update check-out record
      const { data: updatedCheckOut, error: updateError } = await supabase
        .from("check_outs")
        .update({
          actual_time: new Date().toISOString(),
          status: "completed",
          property_photos: data.property_photos || [],
          property_condition: data.property_condition,
          items_left_behind: data.items_left_behind,
          guest_feedback: data.guest_feedback,
          keys_returned: data.keys_returned,
          completed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", checkOut.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error completing check-out:", updateError)
        return NextResponse.json(
          { success: false, error: "Failed to complete check-out" },
          { status: 500 }
        )
      }

      // Update booking status to completed
      await supabase
        .from("bookings")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", data.booking_id)

      // Notify host
      await supabase.from("notifications").insert({
        user_id: checkOut.booking?.listing?.host?.user_id,
        type: "check_out_reminder",
        title: "Guest checked out",
        message: `Your guest has completed checkout`,
        data: { booking_id: data.booking_id },
        action_url: `/dashboard/bookings/${data.booking_id}`,
      })

      // Send review reminder to guest (scheduled for after checkout)
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "review_reminder",
        title: "Leave a review",
        message: "How was your stay? Share your experience with a review.",
        data: { booking_id: data.booking_id },
        action_url: `/guest/reviews/new?booking=${data.booking_id}`,
      })

      return NextResponse.json({
        success: true,
        data: updatedCheckOut,
        message: "Check-out completed successfully. Don't forget to leave a review!",
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Check-out error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
