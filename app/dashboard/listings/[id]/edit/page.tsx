import { DashboardHeader } from "@/components/dashboard/header"
import { ListingForm } from "@/components/dashboard/listing-form"
import { getListingById } from "../../actions"
import { notFound } from "next/navigation"

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { listing } = await getListingById(id)

  if (!listing) {
    notFound()
  }

  // Transform database listing to form format
  const formData = {
    propertyType: listing.property_type,
    location: {
      country: listing.country,
      street: listing.street,
      city: listing.city,
      state: listing.state,
      zip: listing.zip || "",
      coordinates: listing.latitude && listing.longitude
        ? { lat: listing.latitude, lng: listing.longitude }
        : null,
    },
    amenities: listing.amenities || [],
    photos: listing.photos || [],
    pricing: {
      basePrice: listing.base_price,
      cleaningFee: listing.cleaning_fee,
      additionalGuestFee: listing.additional_guest_fee,
      smartPricing: listing.smart_pricing,
    },
    availability: {
      blockedDates: listing.blocked_dates || [],
      minStay: listing.min_stay,
      maxStay: listing.max_stay,
      instantBook: listing.instant_book,
    },
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Edit Listing" subtitle="Update your property details" />
      <div className="p-6">
        <ListingForm listingId={id} initialData={formData} />
      </div>
    </div>
  )
}
