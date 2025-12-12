"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Eye, Power, Trash2, Star } from "lucide-react"
import Link from "next/link"
import type { HostListing } from "@/app/dashboard/actions"
import { deleteListing, toggleListingStatus } from "@/app/dashboard/actions"
import { useRouter } from "next/navigation"
import { useState } from "react"

const propertyTypeLabels: Record<string, string> = {
  "entire-home": "Entire Home",
  "private-room": "Private Room",
  "shared-room": "Shared Room",
  apartment: "Apartment",
  guesthouse: "Guesthouse",
  villa: "Villa",
  studio: "Studio",
  unique: "Unique Stay",
}

interface ListingsGridProps {
  listings: HostListing[]
}

export function ListingsGrid({ listings }: ListingsGridProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive this listing?")) return

    setIsDeleting(id)
    const result = await deleteListing(id)
    setIsDeleting(null)

    if (result.success) {
      router.refresh()
    } else {
      alert("Failed to delete listing: " + result.error)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    setIsDeleting(id)
    const result = await toggleListingStatus(id, currentStatus)
    setIsDeleting(null)

    if (result.success) {
      router.refresh()
    } else {
      alert("Failed to update listing: " + result.error)
    }
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No listings found</p>
        <p className="mt-2 text-sm text-muted-foreground">Create your first listing to get started</p>
        <Link href="/become-a-host" className="mt-4">
          <Button>Create Listing</Button>
        </Link>
      </div>
    )
  }
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {listings.map((listing) => {
        const coverPhoto = listing.photos && listing.photos.length > 0 ? listing.photos[0].url : "/placeholder.svg"
        const location = `${listing.city}, ${listing.country}`
        const title = propertyTypeLabels[listing.property_type] || listing.property_type

        return (
          <Card key={listing.id} className="overflow-hidden border-border/50">
            <div className="relative aspect-[4/3] sm:aspect-[3/2] p-1.5 sm:p-2">
              <img
                src={coverPhoto}
                alt={title}
                className="h-full w-full object-cover rounded-lg"
              />
              <Badge
                className={`absolute right-2.5 sm:right-3 top-2.5 sm:top-3 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 ${
                  listing.status === "published"
                    ? "bg-accent text-accent-foreground"
                    : listing.status === "draft"
                      ? "bg-muted text-muted-foreground"
                      : "bg-destructive/10 text-destructive"
                }`}
              >
                {listing.status}
              </Badge>
            </div>
            <CardContent className="p-2 sm:p-3">
              <div className="mb-1 sm:mb-1.5 flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold truncate">{title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{location}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                      disabled={isDeleting === listing.id}
                    >
                      <MoreHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/listings/${listing.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Performance
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/listings/${listing.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleStatus(listing.id, listing.status)}
                      disabled={isDeleting === listing.id}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {listing.status === "published" ? "Deactivate" : "Publish"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(listing.id)}
                      disabled={isDeleting === listing.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {listing.photos?.length || 0} photos
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-primary">
                  ${listing.base_price}
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">/nt</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
