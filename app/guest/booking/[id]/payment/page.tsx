"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { PaymentMethodSelector, type PaymentMethod } from "@/components/guest/booking/payment-method-selector"
import { PriceBreakdown } from "@/components/guest/booking/price-breakdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Lock } from "lucide-react"
import { toast } from "sonner"

interface PaymentPageProps {
  params: { id: string }
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("moncash")
  const [listing, setListing] = useState<any>(null)

  const listingId = searchParams.get("listing")
  const checkIn = searchParams.get("checkIn")
  const checkOut = searchParams.get("checkOut")
  const guests = parseInt(searchParams.get("guests") || "1")

  useEffect(() => {
    async function loadListing() {
      if (!listingId) {
        router.push("/")
        return
      }

      const { data } = await supabase
        .from("listings")
        .select("id, title, price_per_night, cleaning_fee")
        .eq("id", listingId)
        .single()

      if (data) {
        setListing(data)
      }
      setLoading(false)
    }

    loadListing()
  }, [listingId, router, supabase])

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const handlePayment = async () => {
    setProcessing(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Create booking
      const subtotal = listing.price_per_night * nights
      const cleaningFee = listing.cleaning_fee || 0
      const serviceFee = Math.round(subtotal * 0.1)
      const totalPrice = subtotal + cleaningFee + serviceFee

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          guest_id: user.id,
          listing_id: listingId,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          total_price: totalPrice,
          status: "pending",
        })
        .select("id")
        .single()

      if (bookingError) throw bookingError

      // Route based on payment method
      if (paymentMethod === "moncash") {
        router.push(`/booking/${params.id}/payment/moncash?booking=${booking.id}&amount=${totalPrice}`)
      } else {
        // For card/paypal, process directly
        const { error: paymentError } = await supabase
          .from("payments")
          .insert({
            booking_id: booking.id,
            amount: totalPrice,
            currency: "HTG",
            provider: paymentMethod,
            status: "pending",
          })

        if (paymentError) throw paymentError

        // Simulate payment success for demo
        await supabase
          .from("bookings")
          .update({ status: "confirmed" })
          .eq("id", booking.id)

        router.push(`/booking/${params.id}/payment/success?booking=${booking.id}`)
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Erreur lors du paiement")
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <GuestHeader title="Paiement" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GuestHeader title="Paiement" showBack />
      
      <div className="p-4 space-y-4">
        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />
          </CardContent>
        </Card>

        {/* Price Summary */}
        {listing && (
          <PriceBreakdown
            pricePerNight={listing.price_per_night}
            nights={nights}
            cleaningFee={listing.cleaning_fee || 0}
          />
        )}

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <Lock className="h-4 w-4" />
          <span>Paiement sécurisé SSL</span>
        </div>

        {/* Pay Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handlePayment}
          disabled={processing}
        >
          {processing ? "Traitement en cours..." : "Confirmer et payer"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          En confirmant, vous acceptez les conditions générales de GetIn
        </p>
      </div>
    </div>
  )
}
