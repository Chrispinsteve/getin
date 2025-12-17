"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Calendar, MapPin, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import confetti from "canvas-confetti"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [booking, setBooking] = useState<any>(null)

  const bookingId = searchParams.get("booking")

  useEffect(() => {
    // Celebration effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    async function loadBooking() {
      if (!bookingId) return

      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          check_in,
          check_out,
          total_price,
          listing:listings (
            title,
            location
          )
        `)
        .eq("id", bookingId)
        .single()

      if (data) {
        setBooking(data)
      }
    }

    loadBooking()
  }, [bookingId, supabase])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Icon */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Réservation confirmée!</h1>
          <p className="text-muted-foreground mt-2">
            Merci pour votre réservation. Un email de confirmation vous a été envoyé.
          </p>
        </div>

        {/* Booking Summary */}
        {booking && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">{booking.listing?.title}</h3>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{booking.listing?.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(booking.check_in), "d MMM", { locale: fr })} - {format(new Date(booking.check_out), "d MMM yyyy", { locale: fr })}
                </span>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total payé</span>
                  <span className="font-semibold">
                    {booking.total_price?.toLocaleString()} HTG
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* What's Next */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Et maintenant?</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• L'hôte va confirmer votre réservation</li>
              <li>• Les instructions d'arrivée seront disponibles 48h avant</li>
              <li>• Vous pouvez contacter l'hôte via la messagerie</li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Link href={`/voyages/${bookingId}`} className="block">
            <Button className="w-full" size="lg">
              Voir ma réservation
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button variant="outline" className="w-full">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
