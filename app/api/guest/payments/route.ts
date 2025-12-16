import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { processPaymentSchema, addPaymentMethodSchema } from "@/lib/validations/guest"

// GET - List payment methods
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

    const { data: paymentMethods, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching payment methods:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch payment methods" },
        { status: 500 }
      )
    }

    // Mask sensitive data
    const maskedMethods = paymentMethods?.map(method => ({
      ...method,
      moncash_phone: method.moncash_phone ? `****${method.moncash_phone.slice(-4)}` : null,
      paypal_email: method.paypal_email ? `${method.paypal_email.slice(0, 3)}***@***` : null,
    }))

    return NextResponse.json({ success: true, data: maskedMethods })
  } catch (error) {
    console.error("Payment methods error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Add payment method or process payment
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
    const action = body.action // 'add_method' or 'process_payment'

    if (action === "add_method") {
      const validation = addPaymentMethodSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const data = validation.data

      // If setting as default, unset other defaults
      if (data.is_default) {
        await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", user.id)
      }

      const { data: method, error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          method_type: data.method_type,
          nickname: data.nickname,
          moncash_phone: data.moncash_phone,
          paypal_email: data.paypal_email,
          stripe_payment_method_id: data.stripe_payment_method_id,
          billing_address: data.billing_address,
          is_default: data.is_default,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding payment method:", error)
        return NextResponse.json(
          { success: false, error: "Failed to add payment method" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: method }, { status: 201 })
    }

    if (action === "process_payment") {
      const validation = processPaymentSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const data = validation.data

      // Get booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*, listing:listings(title)")
        .eq("id", data.booking_id)
        .eq("guest_id", user.id)
        .single()

      if (bookingError || !booking) {
        return NextResponse.json(
          { success: false, error: "Booking not found" },
          { status: 404 }
        )
      }

      if (booking.payment_status !== "pending") {
        return NextResponse.json(
          { success: false, error: "Payment already processed" },
          { status: 400 }
        )
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: data.booking_id,
          user_id: user.id,
          amount: data.amount,
          currency: data.currency || "HTG",
          payment_method: data.payment_method,
          payment_type: "booking",
          status: "pending",
        })
        .select()
        .single()

      if (paymentError) {
        console.error("Error creating payment:", paymentError)
        return NextResponse.json(
          { success: false, error: "Failed to initiate payment" },
          { status: 500 }
        )
      }

      // Generate payment URL based on method
      let paymentResponse: { payment_url?: string; client_secret?: string } = {}

      switch (data.payment_method) {
        case "moncash":
          paymentResponse = await initiateMoncashPayment(payment.id, data.amount, data.return_url)
          break
        case "paypal":
          paymentResponse = await initiatePaypalPayment(payment.id, data.amount, data.currency, data.return_url)
          break
        case "stripe":
          paymentResponse = await initiateStripePayment(payment.id, data.amount, data.currency)
          break
        default:
          return NextResponse.json(
            { success: false, error: "Unsupported payment method" },
            { status: 400 }
          )
      }

      return NextResponse.json({
        success: true,
        data: {
          payment_id: payment.id,
          ...paymentResponse,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Payment error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove payment method
export async function DELETE(request: NextRequest) {
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
    const methodId = searchParams.get("id")

    if (!methodId) {
      return NextResponse.json(
        { success: false, error: "Payment method ID required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", methodId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting payment method:", error)
      return NextResponse.json(
        { success: false, error: "Failed to delete payment method" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Payment method deleted" })
  } catch (error) {
    console.error("Delete payment method error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Payment provider functions (to be implemented with actual provider SDKs)
async function initiateMoncashPayment(paymentId: string, amount: number, returnUrl?: string) {
  // MonCash API integration
  const orderId = `GETIN-${paymentId.slice(0, 8)}`
  
  // In production, call MonCash API here
  // const response = await fetch('https://sandbox.moncashbutton.digicelgroup.com/Api/oauth/token', {...})
  
  return {
    payment_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/moncash/redirect?order_id=${orderId}&return_url=${encodeURIComponent(returnUrl || '')}`,
  }
}

async function initiatePaypalPayment(paymentId: string, amount: number, currency: string, returnUrl?: string) {
  // PayPal API integration
  // In production, create PayPal order here
  
  return {
    payment_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paypal/redirect?payment_id=${paymentId}&return_url=${encodeURIComponent(returnUrl || '')}`,
  }
}

async function initiateStripePayment(paymentId: string, amount: number, currency: string) {
  // Stripe API integration
  // In production, create Stripe PaymentIntent here
  
  return {
    client_secret: `pi_${paymentId}_secret_test`,
  }
}
