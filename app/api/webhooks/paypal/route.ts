import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // PayPal webhook event types we care about
    const eventType = body.event_type
    const resource = body.resource

    if (!eventType || !resource) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    // Find payment by PayPal order ID
    const orderId = resource.id || resource.supplementary_data?.related_ids?.order_id
    
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*, booking:bookings(id, guest_id, host_id, listing:listings(title, host:hosts(user_id)))")
      .eq("provider_payment_id", orderId)
      .single()

    if (findError || !payment) {
      console.error("Payment not found for PayPal order:", orderId)
      return NextResponse.json({ received: true }) // Return 200 anyway to not retry
    }

    let newStatus: string
    let paymentStatus: string

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        newStatus = "completed"
        paymentStatus = "captured"
        break
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED":
        newStatus = "failed"
        paymentStatus = "failed"
        break
      case "PAYMENT.CAPTURE.PENDING":
        newStatus = "processing"
        paymentStatus = "authorized"
        break
      case "PAYMENT.CAPTURE.REFUNDED":
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
        provider_transaction_id: resource.id,
        provider_response: body,
        processed_at: newStatus === "completed" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)

    // Update booking
    if (payment.booking) {
      await supabase
        .from("bookings")
        .update({
          payment_status: paymentStatus,
          payment_provider_reference: resource.id,
          paid_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", payment.booking.id)

      // Notifications
      if (newStatus === "completed") {
        const amount = resource.amount?.value || payment.amount
        await supabase.from("notifications").insert([
          {
            user_id: payment.booking.guest_id,
            type: "payment_received",
            title: "Paiement PayPal confirmé",
            message: `Votre paiement de ${amount} USD a été confirmé`,
            data: { booking_id: payment.booking.id },
            action_url: `/guest/bookings/${payment.booking.id}`,
          },
          {
            user_id: payment.booking.listing?.host?.user_id,
            type: "payment_received",
            title: "Paiement PayPal reçu",
            message: `Paiement reçu pour ${payment.booking.listing?.title}`,
            data: { booking_id: payment.booking.id },
            action_url: `/dashboard/bookings/${payment.booking.id}`,
          },
        ])
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("PayPal webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const returnUrl = searchParams.get("return_url")

  // Capture PayPal payment here if needed
  // In production, call PayPal API to capture the order

  const redirectUrl = returnUrl 
    ? `${decodeURIComponent(returnUrl)}?status=success&token=${token}`
    : `/guest/bookings?payment=success`
  
  return NextResponse.redirect(redirectUrl)
}
