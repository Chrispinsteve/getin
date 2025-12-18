import { createClient } from "@/lib/supabase/server"
import { PublicNav } from "@/components/public-nav"
import { Footer } from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, Users, Bed, Search, ArrowRight, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata = {
  title: "GetIn - Trouvez votre prochain chez-vous en Haïti",
  description: "Découvrez des logements uniques en Haïti. Villas, appartements, maisons de plage et plus encore.",
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

export default async function HomePage() {
  const supabase = await createClient()

  // =====================================================
  // CRITICAL: Query uses published_at IS NOT NULL
  // This aligns with the RLS policy and Airbnb-style publishing
  // =====================================================
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .not("published_at", "is", null)  // published_at IS NOT NULL
    .order("published_at", { ascending: false })
    .limit(12)

  if (error) {
    console.error("[HOME] Error fetching listings:", error.message)
  } else {
    console.log("[HOME] Fetched", listings?.length || 0, "published listings")
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero Section - Guest Focused */}
      <section className="relative pt-24 pb-12 lg:pt-32 lg:pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Trouvez votre prochain{" "}
              <span className="text-primary">chez-vous</span> en Haïti
            </h1>
            <p className="text-lg text-muted-foreground">
              Explorez des logements uniques, des villas de luxe aux appartements cosy
            </p>
          </div>

          {/* Simple Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center bg-card border border-border rounded-full shadow-lg p-2 hover:shadow-xl transition-shadow">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Où voulez-vous aller?"
                  className="border-0 p-0 h-auto focus-visible:ring-0 text-base placeholder:text-muted-foreground/60 bg-transparent"
                />
              </div>
              <Button asChild className="rounded-full h-11 px-6">
                <Link href="/listings">Rechercher</Link>
              </Button>
            </div>
          </div>

          {/* Quick Location Links */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["Port-au-Prince", "Pétion-Ville", "Cap-Haïtien", "Jacmel", "Côte des Arcadins"].map(
              (place) => (
                <Button key={place} variant="outline" size="sm" className="rounded-full text-xs" asChild>
                  <Link href={`/listings?location=${encodeURIComponent(place)}`}>{place}</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Logements populaires</h2>
              <p className="text-muted-foreground">Découvrez nos meilleures adresses</p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex">
              <Link href="/listings">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing: any) => {
                const imageUrl = getListingImageUrl(listing)
                const title = getListingTitle(listing)

                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="group">
                    <div className="rounded-xl overflow-hidden transition-all hover:shadow-lg bg-card border">
                      {/* Image with proper fallback */}
                      <div className="aspect-[4/3] relative bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized={imageUrl.includes('supabase')} // Skip optimization for Supabase URLs
                          />
                        ) : (
                          // Fallback placeholder when no image
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
                            <span className="text-sm text-muted-foreground">Photo à venir</span>
                          </div>
                        )}
                        
                        {/* Instant book badge */}
                        {listing.instant_book && (
                          <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            Réservation instantanée
                          </span>
                        )}
                      </div>

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

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/listings">
                Voir tous les logements
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Become a Host CTA - Non-intrusive */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Vous avez un logement à partager?
            </h2>
            <p className="text-muted-foreground mb-8">
              Rejoignez des centaines d'hôtes en Haïti et commencez à gagner de l'argent
              en accueillant des voyageurs du monde entier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/become-a-host">
                  Devenir hôte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/how-hosting-works">En savoir plus</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
