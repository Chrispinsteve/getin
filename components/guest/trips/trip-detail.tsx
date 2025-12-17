"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TripStatusBadge } from "./trip-status-badge"
import { 
  MapPin, 
  Calendar, 
  Users, 
  MessageSquare, 
  Phone,
  FileText,
  Star,
  Clock,
  Home,
  DoorOpen,
  LogOut
} from "lucide-react"
import { format, differenceInHours, differenceInDays, isPast, isFuture } from "date-fns"
import { fr } from "date-fns/locale"

interface TripDetailProps {
  booking: {
    id: string
    status: "pending" | "accepted" | "confirmed" | "active" | "completed" | "cancelled"
    checkIn: Date
    checkOut: Date
    guests: number
    totalPrice: number
    listing: {
      id: string
      title: string
      location: string
      address?: string
      images: string[]
    }
    host: {
      id: string
      name: string
      avatar?: string
      phone?: string
    }
    hasReview?: boolean
  }
}

export function TripDetail({ booking }: TripDetailProps) {
  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)
  const now = new Date()

  const hoursUntilCheckIn = differenceInHours(checkInDate, now)
  const daysUntilCheckIn = differenceInDays(checkInDate, now)
  const hoursAfterCheckout = differenceInHours(now, checkOutDate)

  const canViewInstructions = hoursUntilCheckIn <= 48 || booking.status === "active"
  const canCheckIn = hoursUntilCheckIn <= 24 && hoursUntilCheckIn >= -24
  const isActive = booking.status === "active"
  const isCompleted = booking.status === "completed"
  const canReview = isCompleted && hoursAfterCheckout >= 4 && !booking.hasReview

  const nights = differenceInDays(checkOutDate, checkInDate)

  return (
    <div className="space-y-4">
      {/* Hero Image */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-xl">
        <Image
          src={booking.listing.images?.[0] || "/placeholder-property.jpg"}
          alt={booking.listing.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <TripStatusBadge status={booking.status} size="lg" showIcon />
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-white">
            {booking.listing.title}
          </h1>
          <div className="flex items-center gap-1 text-white/90 text-sm mt-1">
            <MapPin className="h-4 w-4" />
            <span>{booking.listing.location}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {canViewInstructions && (
          <Link href={`/voyages/${booking.id}/instructions`}>
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
              <DoorOpen className="h-5 w-5" />
              <span className="text-xs">Instructions</span>
            </Button>
          </Link>
        )}
        
        <Link href={`/voyages/${booking.id}/messages`}>
          <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Messages</span>
          </Button>
        </Link>

        {isActive && (
          <Link href={`/voyages/${booking.id}/checkout`}>
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
              <LogOut className="h-5 w-5" />
              <span className="text-xs">Check-out</span>
            </Button>
          </Link>
        )}

        {canReview && (
          <Link href={`/voyages/${booking.id}/review`}>
            <Button className="w-full h-auto py-3 flex-col gap-1">
              <Star className="h-5 w-5" />
              <span className="text-xs">Laisser un avis</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Timing Alert */}
      {isFuture(checkInDate) && daysUntilCheckIn <= 7 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">
                  {daysUntilCheckIn === 0 
                    ? "Arrivée aujourd'hui!"
                    : daysUntilCheckIn === 1
                    ? "Arrivée demain!"
                    : `Arrivée dans ${daysUntilCheckIn} jours`}
                </p>
                {!canViewInstructions && (
                  <p className="text-xs text-muted-foreground">
                    Les instructions seront disponibles 48h avant l'arrivée
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Détails de la réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Arrivée</span>
            </div>
            <span className="font-medium text-sm">
              {format(checkInDate, "EEE d MMM yyyy", { locale: fr })}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Départ</span>
            </div>
            <span className="font-medium text-sm">
              {format(checkOutDate, "EEE d MMM yyyy", { locale: fr })}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Voyageurs</span>
            </div>
            <span className="font-medium text-sm">
              {booking.guests} voyageur{booking.guests > 1 ? "s" : ""}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span>Durée</span>
            </div>
            <span className="font-medium text-sm">
              {nights} nuit{nights > 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Host Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Votre hôte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={booking.host.avatar} />
                <AvatarFallback>
                  {booking.host.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{booking.host.name}</p>
                <p className="text-xs text-muted-foreground">Hôte</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link href={`/voyages/${booking.id}/messages`}>
                <Button size="icon" variant="outline">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
              {booking.host.phone && canViewInstructions && (
                <a href={`tel:${booking.host.phone}`}>
                  <Button size="icon" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Récapitulatif du prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {(booking.totalPrice / nights).toLocaleString()} HTG x {nights} nuits
            </span>
            <span>{booking.totalPrice.toLocaleString()} HTG</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{booking.totalPrice.toLocaleString()} HTG</span>
          </div>
        </CardContent>
      </Card>

      {/* Address (only when instructions unlocked) */}
      {canViewInstructions && booking.listing.address && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Adresse</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{booking.listing.address}</p>
            <Button variant="outline" className="w-full mt-3" asChild>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(booking.listing.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Ouvrir dans Maps
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
