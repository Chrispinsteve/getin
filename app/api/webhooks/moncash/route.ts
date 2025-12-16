import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// MonCash webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    const { transactionId, orderId, amount, status } = body

    // Extract payment ID from order ID (format: GETIN-{paymentId})
    const paymentIdMatch = orderId?.match(/GETIN-([a-zA-Z0-9-]+)/)
    if (!paymentIdMatch) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    // Find payment
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*, booking:bookings(id, guest_id, host_id, listing:listings(title, host:hosts(user_id)))")
      .or(`provider_reference.eq.${orderId},id.ilike.${paymentIdMatch[1]}%`)
      .single()

    if (findError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Map MonCash status
    let newStatus: string
    let paymentStatus: string

    switch (status?.toLowerCase()) {
      case "successful":
      case "success":
        newStatus = "completed"
        paymentStatus = "captured"
        break
      case "failed":
      case "error":
        newStatus = "failed"
        paymentStatus = "failed"
        break
      default:
        newStatus = "pending"
        paymentStatus = "pending"
    }

    // Update payment
    await supabase
      .from("payments")
      .update({
        status: newStatus,
        provider_transaction_id: transactionId,
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
          payment_provider_reference: transactionId,
          paid_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", payment.booking.id)

      // Notifications
      if (newStatus === "completed") {
        await supabase.from("notifications").insert([
          {
            user_id: payment.booking.guest_id,
            type: "payment_received",
            title: "Paiement confirmé",
            message: `Votre paiement de ${amount} HTG a été confirmé`,
            data: { booking_id: payment.booking.id },
            action_url: `/guest/bookings/${payment.booking.id}`,
          },
          {
            user_id: payment.booking.listing?.host?.user_id,
            type: "payment_received",
            title: "Paiement reçu",
            message: `Paiement reçu pour ${payment.booking.listing?.title}`,
            data: { booking_id: payment.booking.id },
            action_url: `/dashboard/bookings/${payment.booking.id}`,
          },
        ])
      } else if (newStatus === "failed") {
        await supabase.from("notifications").insert({
          user_id: payment.booking.guest_id,
          type: "payment_failed",
          title: "Échec du paiement",
          message: "Votre paiement a échoué. Veuillez réessayer.",
          data: { booking_id: payment.booking.id },
          action_url: `/guest/bookings/${payment.booking.id}`,
        })
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error("MonCash webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get("transactionId")
  const returnUrl = searchParams.get("return_url")

  const redirectUrl = returnUrl 
    ? `${decodeURIComponent(returnUrl)}?status=success&transaction_id=${transactionId}`
    : `/guest/bookings?payment=success`
  
  return NextResponse.redirect(redirectUrl)
}
