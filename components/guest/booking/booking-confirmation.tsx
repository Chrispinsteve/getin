"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { PriceBreakdown } from "./price-breakdown"
import { 
  Calendar, 
  Users, 
  MapPin, 
  Shield, 
  ChevronRight,
  Info
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface BookingConfirmationProps {
  data: {
    listing: {
      id: string
      title: string
      location: string
      image: string
      pricePerNight: number
      cleaningFee: number
      cancellationPolicy: string
    }
    host: {
      name: string
      avatar?: string
    }
    checkIn: Date
    checkOut: Date
    guests: number
    nights: number
  }
}

const policyLabels: Record<string, string> = {
  flexible: "Annulation gratuite jusqu'à 24h avant",
  moderate: "Annulation gratuite jusqu'à 5 jours avant",
  strict: "Annulation gratuite jusqu'à 14 jours avant",
}

export function BookingConfirmation({ data }: BookingConfirmationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    setLoading(true)
    const params = new URLSearchParams({
      listing: data.listing.id,
      checkIn: data.checkIn.toISOString(),
      checkOut: data.checkOut.toISOString(),
      guests: data.guests.toString(),
    })
    router.push(`/booking/${data.listing.id}/payment?${params}`)
  }

  return (
    <div className="space-y-4">
      {/* Listing Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={data.listing.image || "/placeholder-property.jpg"}
                alt={data.listing.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-1">{data.listing.title}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{data.listing.location}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={data.host.avatar} />
                  <AvatarFallback className="text-[10px]">
                    {data.host.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  Hôte: {data.host.name}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Votre voyage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Dates</p>
                <p className="text-sm text-muted-foreground">
                  {format(data.checkIn, "d MMM", { locale: fr })} - {format(data.checkOut, "d MMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
            <Link href={`/listings/${data.listing.id}`}>
              <Button variant="ghost" size="sm">
                Modifier
              </Button>
            </Link>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Voyageurs</p>
                <p className="text-sm text-muted-foreground">
                  {data.guests} voyageur{data.guests > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Link href={`/listings/${data.listing.id}`}>
              <Button variant="ghost" size="sm">
                Modifier
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <PriceBreakdown
        pricePerNight={data.listing.pricePerNight}
        nights={data.nights}
        cleaningFee={data.listing.cleaningFee}
      />

      {/* Cancellation Policy */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Conditions d'annulation</p>
              <p className="text-sm text-muted-foreground">
                {policyLabels[data.listing.cancellationPolicy] || policyLabels.flexible}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ground Rules */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Règles de base</p>
              <p className="text-sm text-muted-foreground">
                Nous demandons à tous les voyageurs de respecter quelques règles simples pour être un voyageur de qualité.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Respectez le règlement intérieur</li>
                <li>• Traitez le logement comme le vôtre</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="space-y-2">
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? "Chargement..." : "Continuer vers le paiement"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Vous ne serez pas débité maintenant
        </p>
      </div>
    </div>
  )
}
