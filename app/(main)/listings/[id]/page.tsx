import { createClient } from "@/lib/supabase/server"
import { PublicNav } from "@/components/public-nav"
import { Footer } from "@/components/footer"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Wifi, Car, Coffee, Star, Bed, Bath } from "lucide-react"

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Also check for "active" status (not just "published")
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .in("status", ["published", "active"])
    .single()

  if (!listing) {
    notFound()
  }

  const amenities = listing.amenities || []
  const images = listing.images || listing.photos?.map((p: any) => p.url) || []
  const primaryImage = images[0] || null

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="pt-20">
        {/* Image Gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="aspect-[16/9] lg:aspect-[21/9] relative rounded-xl overflow-hidden bg-muted">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={listing.title || "Property"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🏠</span>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Location */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  {listing.title || listing.property_type || "Logement"}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {listing.city || listing.location || "Haïti"}
                    </span>
                  </div>
                  {listing.average_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{listing.average_rating}</span>
                      {listing.review_count && (
                        <span className="text-muted-foreground">
                          ({listing.review_count} avis)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-6 py-4 border-y">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span>{listing.max_guests || 2} voyageurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-5 h-5 text-muted-foreground" />
                  <span>{listing.bedrooms || 1} chambre{(listing.bedrooms || 1) > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="w-5 h-5 text-muted-foreground" />
                  <span>{listing.bathrooms || 1} salle{(listing.bathrooms || 1) > 1 ? "s" : ""} de bain</span>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">À propos de ce logement</h2>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              )}

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Équipements</h2>
                {amenities.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        {amenity.toLowerCase().includes("wifi") && <Wifi className="w-5 h-5 text-muted-foreground" />}
                        {amenity.toLowerCase().includes("parking") && <Car className="w-5 h-5 text-muted-foreground" />}
                        {amenity.toLowerCase().includes("coffee") && <Coffee className="w-5 h-5 text-muted-foreground" />}
                        {!amenity.toLowerCase().includes("wifi") && 
                         !amenity.toLowerCase().includes("parking") && 
                         !amenity.toLowerCase().includes("coffee") && (
                          <span className="w-5 h-5 text-center">✓</span>
                        )}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun équipement listé.</p>
                )}
              </div>
            </div>

            {/* Booking Card */}
            <div>
              <div className="sticky top-24 border rounded-xl p-6 bg-card shadow-lg">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold">
                      {(listing.price_per_night || listing.base_price || 0).toLocaleString()} HTG
                    </span>
                    <span className="text-muted-foreground">/ nuit</span>
                  </div>
                  {listing.cleaning_fee && (
                    <p className="text-sm text-muted-foreground">
                      + {listing.cleaning_fee.toLocaleString()} HTG frais de ménage
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">ARRIVÉE</p>
                      <p className="font-medium">Choisir</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">DÉPART</p>
                      <p className="font-medium">Choisir</p>
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">VOYAGEURS</p>
                    <p className="font-medium">1 voyageur</p>
                  </div>
                </div>

                {/* Book button links to guest booking flow */}
                <Button asChild className="w-full" size="lg">
                  <Link href={`/guest/booking/${id}/confirm`}>
                    Réserver
                  </Link>
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Vous ne serez débité que si vous confirmez
                </p>

                {listing.minimum_stay && listing.minimum_stay > 1 && (
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Séjour minimum: {listing.minimum_stay} nuits
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

