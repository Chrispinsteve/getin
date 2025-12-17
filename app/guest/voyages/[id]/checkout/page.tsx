"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { CheckoutChecklist, type CheckoutData } from "@/components/guest/trips/checkout-checklist"
import { toast } from "sonner"

interface CheckoutPageProps {
  params: { id: string }
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleCheckout = async (data: CheckoutData) => {
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      // Create check-out record
      const { error: checkoutError } = await supabase
        .from("check_outs")
        .insert({
          booking_id: params.id,
          guest_id: user.id,
          keys_returned: data.keysReturned,
          trash_disposed: data.trashDisposed,
          windows_closed: data.windowsClosed,
          lights_off: data.lightsOff,
          property_condition: data.overallCondition,
          issues_reported: data.issues,
          completed_at: new Date().toISOString(),
        })

      if (checkoutError) throw checkoutError

      // Update booking status to completed
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", params.id)
        .eq("guest_id", user.id)

      if (bookingError) throw bookingError

      toast.success("Check-out effectué avec succès!")
      router.push(`/voyages/${params.id}`)
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("Erreur lors du check-out")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <GuestHeader title="Check-out" showBack />
      
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-6">
          Avant de partir, veuillez confirmer que vous avez effectué les actions suivantes.
        </p>
        
        <CheckoutChecklist onSubmit={handleCheckout} loading={loading} />
      </div>
    </div>
  )
}
