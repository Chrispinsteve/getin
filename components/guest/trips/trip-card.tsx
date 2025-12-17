"use client"

import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Users } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface TripCardProps {
  id: string
  listing: {
    id: string
    title: string
    location: string
    images: string[]
  }
  checkIn: Date
  checkOut: Date
  guests: number
  status: "pending" | "accepted" | "confirmed" | "active" | "completed" | "cancelled"
  totalPrice: number
}

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Accepté", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmé", color: "bg-green-100 text-green-800" },
  active: { label: "En cours", color: "bg-purple-100 text-purple-800" },
  completed: { label: "Terminé", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Annulé", color: "bg-red-100 text-red-800" },
}

export function TripCard({ 
  id, 
  listing, 
  checkIn, 
  checkOut, 
  guests, 
  status, 
  totalPrice 
}: TripCardProps) {
  const config = statusConfig[status]
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  return (
    <Link href={`/voyages/${id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex">
          {/* Image */}
          <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
            <Image
              src={listing.images?.[0] || "/placeholder-property.jpg"}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                  {listing.title}
                </h3>
                <Badge className={cn("shrink-0 text-[10px] sm:text-xs", config.color)}>
                  {config.label}
                </Badge>
              </div>

              <div className="mt-1 flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{listing.location}</span>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {format(checkInDate, "d MMM", { locale: fr })} - {format(checkOutDate, "d MMM yyyy", { locale: fr })}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3 w-3 shrink-0" />
                  <span>{guests} voyageur{guests > 1 ? "s" : ""}</span>
                </div>

                <p className="font-semibold text-sm sm:text-base">
                  {totalPrice.toLocaleString()} HTG
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
