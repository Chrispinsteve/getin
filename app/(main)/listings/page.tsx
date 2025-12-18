import { createClient } from "@/lib/supabase/server"
import { PublicNav } from "@/components/public-nav"
import { Footer } from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, Users, Bed, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Explorer les logements | GetIn",
  description: "Trouvez des logements uniques en Haïti",
}

// Helper to get the first valid image URL from a listing
function getListingImageUrl(listing: any): string | null {
  // Try photos array (JSONB with objects)
  if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
    const firstPhoto = listing.photos[0]
    if (typeof firstPhoto === 'string') {
      return firstPhoto
    }
    if (firstPhoto?.url) {
      return firstPhoto.url
    }
  }
  
  // Try images array (simple string array)
  if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
    return listing.images[0]
  }
  
  return null
}

// Helper to get listing title with fallback
function getListingTitle(listing: any): string {
  if (listing.title && listing.title.trim()) {
    return listing.title
  }
  
  // Fallback: generate title from property type and city
  const typeLabels: Record<string, string> = {
    "entire-home": "Maison entière",
    "private-room": "Chambre privée",
    "shared-room": "Chambre partagée",
    apartment: "Appartement",
    guesthouse: "Maison d'hôtes",
    villa: "Villa",
    studio: "Studio",
    unique: "Logement unique",
  }
  
  const type = typeLabels[listing.property_type] || listing.property_type || "Logement"
  const city = listing.city || "Haïti"
  
  return `${type} à ${city}`
}

export default async function ListingsPage() {
  const supabase = await createClient()
  
  // Status must be "published" - matches RLS policy
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[LISTINGS] Error fetching listings:", error.message)
  } else {
    console.log("[LISTINGS] Fetched", listings?.length || 0, "listings")
  }

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 pt-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Découvrez des logements en Haïti</h1>
            <p className="text-muted-foreground">Trouvez l'endroit parfait pour votre prochain séjour</p>
          </div>

          {/* Search/Filter Bar - Simplified */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button variant="outline" size="sm">Tous les types</Button>
            <Button variant="outline" size="sm">Prix</Button>
            <Button variant="outline" size="sm">Équipements</Button>
            <Button variant="outline" size="sm">Plus de filtres</Button>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing: any) => {
                const imageUrl = getListingImageUrl(listing)
                const title = getListingTitle(listing)
                
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group"
                  >
                    <div className="rounded-xl overflow-hidden transition-all hover:shadow-lg bg-card border">
                      {/* Image with proper fallback */}
                      <div className="aspect-[4/3] relative bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized={imageUrl.includes('supabase')}
                          />
                        ) : (
                          // Fallback placeholder when no image
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
                            <span className="text-sm text-muted-foreground">Photo à venir</span>
                          </div>
                        )}
                        
                        {listing.instant_book && (
                          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            Réservation instantanée
                          </span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-4">
                        {/* Title - ALWAYS displayed */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold line-clamp-1" title={title}>
                            {title}
                          </h3>
                          {listing.average_rating > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{listing.average_rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Location */}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">
                            {listing.city || "Haïti"}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {listing.bedrooms || 1} ch.
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {listing.max_guests || 2} pers.
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className="mt-3 pt-3 border-t">
                          <span className="font-semibold text-lg">
                            {(listing.base_price || 0).toLocaleString()} HTG
                          </span>
                          <span className="text-sm text-muted-foreground"> / nuit</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-secondary/30 rounded-2xl">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-2">Aucun logement disponible</h3>
              <p className="text-muted-foreground mb-6">
                Soyez le premier à proposer votre logement sur GetIn!
              </p>
              <Button asChild>
                <Link href="/become-a-host">Devenir hôte</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
