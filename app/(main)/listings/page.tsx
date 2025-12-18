import { createClient } from "@/lib/supabase/server"
import { PublicNav } from "@/components/public-nav"
import { Footer } from "@/components/footer"
import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, Users, Bed } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Explorer les logements | GetIn",
  description: "Trouvez des logements uniques en Haïti",
}

export default async function ListingsPage() {
  const supabase = await createClient()
  
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

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
                const imageUrl = listing.images?.[0] || listing.photos?.[0]?.url || null
                
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group"
                  >
                    <div className="rounded-xl overflow-hidden transition-all hover:shadow-lg bg-card border">
                      {/* Image */}
                      <div className="aspect-[4/3] relative bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={listing.title || "Property"}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-secondary">
                            <span className="text-4xl">🏠</span>
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
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold line-clamp-1">
                            {listing.title || listing.property_type || "Logement"}
                          </h3>
                          {listing.average_rating && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{listing.average_rating}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">
                            {listing.city || listing.location || "Haïti"}
                          </span>
                        </div>

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
                        
                        <div className="mt-3 pt-3 border-t">
                          <span className="font-semibold text-lg">
                            {(listing.price_per_night || listing.base_price || 0).toLocaleString()} HTG
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

