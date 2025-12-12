import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import Link from "next/link"
import Image from "next/image"

export default async function ListingsPage() {
  const supabase = await createClient()
  
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Listings</h1>
          <p className="text-muted-foreground">Discover amazing places to stay</p>
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing: any) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group"
              >
                <div className="rounded-lg border bg-card overflow-hidden transition-all hover:shadow-lg">
                  {listing.photos && listing.photos.length > 0 && (
                    <div className="aspect-video relative bg-muted">
                      <Image
                        src={listing.photos[0]?.url || "/placeholder.jpg"}
                        alt={listing.photos[0]?.caption || "Listing photo"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">
                      {listing.property_type || "Property"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {listing.city && listing.state
                        ? `${listing.city}, ${listing.state}`
                        : listing.country || "Location"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        ${listing.base_price || 0}
                        <span className="text-sm font-normal text-muted-foreground">/night</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No listings available yet.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

