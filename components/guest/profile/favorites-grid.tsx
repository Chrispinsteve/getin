"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MapPin, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FavoriteListingProps {
  id: string
  title: string
  location: string
  pricePerNight: number
  rating?: number
  reviewCount?: number
  images: string[]
  isFavorite?: boolean
  onToggleFavorite?: (id: string) => void
}

export function FavoriteCard({
  id,
  title,
  location,
  pricePerNight,
  rating,
  reviewCount,
  images,
  isFavorite = true,
  onToggleFavorite,
}: FavoriteListingProps) {
  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-[4/3]">
        <Link href={`/listings/${id}`}>
          <Image
            src={images?.[0] || "/placeholder-property.jpg"}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
          onClick={(e) => {
            e.preventDefault()
            onToggleFavorite?.(id)
          }}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            )}
          />
        </Button>
      </div>
      <Link href={`/listings/${id}`}>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-1">{title}</h3>
            {rating && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="text-xs line-clamp-1">{location}</span>
          </div>
          <p className="mt-2 text-sm">
            <span className="font-semibold">{pricePerNight.toLocaleString()} HTG</span>
            <span className="text-muted-foreground"> / nuit</span>
          </p>
        </div>
      </Link>
    </Card>
  )
}

interface FavoritesGridProps {
  listings: FavoriteListingProps[]
  onToggleFavorite?: (id: string) => void
  emptyMessage?: string
}

export function FavoritesGrid({
  listings,
  onToggleFavorite,
  emptyMessage = "Aucun favori pour le moment",
}: FavoritesGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-secondary p-4 mb-4">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Aucun favori</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {emptyMessage}
        </p>
        <Link href="/">
          <Button className="mt-4">Explorer les logements</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {listings.map((listing) => (
        <FavoriteCard
          key={listing.id}
          {...listing}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
