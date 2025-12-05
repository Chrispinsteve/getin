import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Wifi, Car, Coffee } from "lucide-react"

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (!listing) {
    notFound()
  }

  const amenities = listing.amenities || []

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            {listing.photos && listing.photos.length > 0 && (
              <div className="aspect-video relative rounded-lg overflow-hidden mb-6">
                <Image
                  src={listing.photos[0]?.url || "/placeholder.jpg"}
                  alt={listing.photos[0]?.caption || "Listing photo"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {listing.property_type || "Property"}
                </h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    {listing.street && `${listing.street}, `}
                    {listing.city && `${listing.city}, `}
                    {listing.state && `${listing.state} `}
                    {listing.zip && listing.zip}
                    {listing.country && `, ${listing.country}`}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                {amenities.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center text-sm">
                        {amenity.toLowerCase().includes("wifi") && <Wifi className="w-4 h-4 mr-2" />}
                        {amenity.toLowerCase().includes("parking") && <Car className="w-4 h-4 mr-2" />}
                        {amenity.toLowerCase().includes("coffee") && <Coffee className="w-4 h-4 mr-2" />}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No amenities listed.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-4 border rounded-lg p-6 bg-card">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-bold">${listing.base_price || 0}</span>
                  <span className="text-muted-foreground">/night</span>
                </div>
                {listing.cleaning_fee && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Cleaning fee: ${listing.cleaning_fee}
                  </p>
                )}
                {listing.additional_guest_fee && (
                  <p className="text-sm text-muted-foreground">
                    Additional guest fee: ${listing.additional_guest_fee}
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-4 text-sm">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Check-in/Check-out</p>
                    <p className="text-muted-foreground">Flexible dates</p>
                  </div>
                </div>
                {listing.min_stay && (
                  <div className="flex items-center gap-4 text-sm">
                    <Users className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Minimum stay</p>
                      <p className="text-muted-foreground">{listing.min_stay} nights</p>
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full" size="lg">
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

