import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")
    const supabase = await createClient()

    // In production, verify webhook signature with Stripe
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    
    const event = JSON.parse(body)
    const paymentIntent = event.data?.object

    if (!paymentIntent) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 })
    }

    // Find payment by Stripe payment intent ID
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*, booking:bookings(id, guest_id, host_id, listing:listings(title, host:hosts(user_id)))")
      .eq("provider_payment_id", paymentIntent.id)
      .single()

    if (findError || !payment) {
      // Try finding by metadata
      const bookingId = paymentIntent.metadata?.booking_id
      if (!bookingId) {
        return NextResponse.json({ received: true })
      }

      const { data: paymentByBooking } = await supabase
        .from("payments")
        .select("*, booking:bookings(id, guest_id, host_id, listing:listings(title, host:hosts(user_id)))")
        .eq("booking_id", bookingId)
        .eq("payment_method", "stripe")
        .single()

      if (!paymentByBooking) {
        return NextResponse.json({ received: true })
      }
    }

    const targetPayment = payment || null
    if (!targetPayment) {
      return NextResponse.json({ received: true })
    }

    let newStatus: string
    let paymentStatus: string

    switch (event.type) {
      case "payment_intent.succeeded":
        newStatus = "completed"
        paymentStatus = "captured"
        break
      case "payment_intent.payment_failed":
        newStatus = "failed"
        paymentStatus = "failed"
        break
      case "payment_intent.processing":
        newStatus = "processing"
        paymentStatus = "authorized"
        break
      case "charge.refunded":
        newStatus = "refunded"
        paymentStatus = "refunded"
        break
      default:
        return NextResponse.json({ received: true })
    }

    // Update payment
    await supabase
      .from("payments")
      .update({
        status: newStatus,
        provider_transaction_id: paymentIntent.latest_charge || paymentIntent.id,
        provider_response: event,
        processed_at: newStatus === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetPayment.id)

    // Update booking
    if (targetPayment.booking) {
      await supabase
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          payment_intent_id: paymentIntent.id,
          paid_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", targetPayment.booking.id)

      // Notifications
      if (newStatus === "completed") {
        const amount = (paymentIntent.amount / 100).toFixed(2)
        const currency = paymentIntent.currency?.toUpperCase() || "USD"
        
        await supabase.from("notifications").insert([
          {
            user_id: targetPayment.booking.guest_id,
            type: "payment_received",
            title: "Paiement confirmé",
            message: `Votre paiement de ${amount} ${currency} a été confirmé`,
            data: { booking_id: targetPayment.booking.id },
            action_url: `/guest/bookings/${targetPayment.booking.id}`,
          },
          {
            user_id: targetPayment.booking.listing?.host?.user_id,
            type: "payment_received",
            title: "Paiement reçu",
            message: `Paiement reçu pour ${targetPayment.booking.listing?.title}`,
            data: { booking_id: targetPayment.booking.id },
            action_url: `/dashboard/bookings/${targetPayment.booking.id}`,
          },
        ])
      } else if (newStatus === "failed") {
        await supabase.from("notifications").insert({
          user_id: targetPayment.booking.guest_id,
          type: "payment_failed",
          title: "Échec du paiement",
          message: paymentIntent.last_payment_error?.message || "Votre paiement a échoué",
          data: { booking_id: targetPayment.booking.id },
          action_url: `/guest/bookings/${targetPayment.booking.id}`,
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
