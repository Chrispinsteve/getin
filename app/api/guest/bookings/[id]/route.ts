import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cancelBookingSchema } from "@/lib/validations/guest"

// GET - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        listing:listings(
          id,
          title,
          description,
          property_type,
          street,
          city,
          state,
          country,
          zip,
          latitude,
          longitude,
          photos,
          base_price,
          amenities,
          house_rules,
          check_in_instructions,
          access_code,
          wifi_password,
          cancellation_policy
        ),
        host:hosts!bookings_host_id_fkey(
          id,
          user_id,
          first_name,
          last_name,
          profile_picture_url,
          phone,
          email,
          superhost,
          response_rate,
          response_time_hours
        )
      `)
      .eq("id", id)
      .eq("guest_id", user.id)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    // Get check-in record
    const { data: checkIn } = await supabase
      .from("check_ins")
      .select("*")
      .eq("booking_id", id)
      .single()

    // Get check-out record
    const { data: checkOut } = await supabase
      .from("check_outs")
      .select("*")
      .eq("booking_id", id)
      .single()

    // Get guest's review if exists
    const { data: review } = await supabase
      .from("reviews")
      .select("*")
      .eq("booking_id", id)
      .eq("reviewer_id", user.id)
      .single()

    // Get conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("booking_id", id)
      .single()

    // Get payments
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: false })

    // Determine what actions are available
    const today = new Date()
    const checkInDate = new Date(booking.check_in)
    const checkOutDate = new Date(booking.check_out)
    
    const actions = {
      can_cancel: ["pending", "accepted", "confirmed"].includes(booking.status) && checkInDate > today,
      can_modify: booking.status === "pending" && checkInDate > today,
      can_check_in: booking.status === "confirmed" && !checkIn && 
        today >= new Date(checkInDate.getTime() - 24 * 60 * 60 * 1000) && // 24h before check-in
        today < checkOutDate,
      can_check_out: booking.status === "confirmed" && checkIn?.status === "completed" && !checkOut,
      can_review: booking.status === "completed" && !review,
      can_message: booking.status !== "cancelled" && booking.status !== "declined",
      can_pay: booking.payment_status === "pending" && booking.status !== "cancelled" && booking.status !== "declined",
    }

    // Calculate cancellation policy details
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    let refundPercentage = 0
    
    switch (booking.listing?.cancellation_policy) {
      case "flexible":
        refundPercentage = daysUntilCheckIn >= 1 ? 100 : 0
        break
      case "moderate":
        refundPercentage = daysUntilCheckIn >= 5 ? 100 : daysUntilCheckIn >= 1 ? 50 : 0
        break
      case "strict":
        refundPercentage = daysUntilCheckIn >= 14 ? 100 : daysUntilCheckIn >= 7 ? 50 : 0
        break
      default:
        refundPercentage = daysUntilCheckIn >= 7 ? 100 : 50
    }

    const potentialRefund = Math.round((booking.total_amount - booking.service_fee) * refundPercentage / 100)

    return NextResponse.json({
      success: true,
      data: {
        ...booking,
        check_in_record: checkIn,
        check_out_record: checkOut,
        guest_review: review,
        conversation_id: conversation?.id,
        payments: payments || [],
        actions,
        cancellation_info: {
          days_until_check_in: daysUntilCheckIn,
          refund_percentage: refundPercentage,
          potential_refund: potentialRefund,
          policy: booking.listing?.cancellation_policy || "flexible",
        },
      },
    })
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update booking (modify or cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const action = body.action // 'cancel' or 'modify'

    // Get current booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        listing:listings(cancellation_policy, title),
        host:hosts!bookings_host_id_fkey(user_id)
      `)
      .eq("id", id)
      .eq("guest_id", user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      )
    }

    if (action === "cancel") {
      const validation = cancelBookingSchema.safeParse({ booking_id: id, reason: body.reason })
      
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Invalid request" },
          { status: 400 }
        )
      }

      // Check if can be cancelled
      if (!["pending", "accepted", "confirmed"].includes(booking.status)) {
        return NextResponse.json(
          { success: false, error: "This booking cannot be cancelled" },
          { status: 400 }
        )
      }

      const checkInDate = new Date(booking.check_in)
      const today = new Date()
      
      if (checkInDate <= today) {
        return NextResponse.json(
          { success: false, error: "Cannot cancel a booking that has already started" },
          { status: 400 }
        )
      }

      // Calculate refund based on policy
      const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      let refundPercentage = 0
      
      switch (booking.listing?.cancellation_policy) {
        case "flexible":
          refundPercentage = daysUntilCheckIn >= 1 ? 100 : 0
          break
        case "moderate":
          refundPercentage = daysUntilCheckIn >= 5 ? 100 : daysUntilCheckIn >= 1 ? 50 : 0
          break
        case "strict":
          refundPercentage = daysUntilCheckIn >= 14 ? 100 : daysUntilCheckIn >= 7 ? 50 : 0
          break
        default:
          refundPercentage = daysUntilCheckIn >= 7 ? 100 : 50
      }

      const refundAmount = Math.round((booking.total_amount - booking.service_fee) * refundPercentage / 100)

      // Update booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled_by_guest",
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: body.reason || "Cancelled by guest",
          refund_amount: refundAmount,
          refund_status: refundAmount > 0 ? "requested" : "none",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (updateError) {
        console.error("Error cancelling booking:", updateError)
        return NextResponse.json(
          { success: false, error: "Failed to cancel booking" },
          { status: 500 }
        )
      }

      // Notify host
      await supabase.from("notifications").insert({
        user_id: booking.host?.user_id,
        type: "booking_cancelled",
        title: "Réservation annulée",
        message: `La réservation pour ${booking.listing?.title} du ${booking.check_in} au ${booking.check_out} a été annulée par le voyageur.`,
        data: { booking_id: id },
        action_url: `/dashboard/bookings/${id}`,
      })

      // Process refund if applicable
      if (refundAmount > 0 && booking.payment_status === "captured") {
        await supabase.from("payments").insert({
          booking_id: id,
          user_id: user.id,
          amount: refundAmount,
          currency: booking.currency,
          payment_method: booking.payment_method,
          payment_type: "refund",
          status: "pending",
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          booking: updatedBooking,
          refund_amount: refundAmount,
          refund_percentage: refundPercentage,
        },
        message: refundAmount > 0 
          ? `Réservation annulée. Un remboursement de ${refundAmount} ${booking.currency} sera traité.`
          : "Réservation annulée. Aucun remboursement n'est applicable selon la politique d'annulation.",
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Booking update error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
