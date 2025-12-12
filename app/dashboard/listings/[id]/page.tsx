import { DashboardHeader } from "@/components/dashboard/header"
import { ListingPerformance } from "@/components/dashboard/listing-performance"
import { getListingById } from "../actions"
import { notFound } from "next/navigation"

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

export default async function ListingPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { listing } = await getListingById(id)

  if (!listing) {
    notFound()
  }

  const title = propertyTypeLabels[listing.property_type] || listing.property_type
  const location = `${listing.city}, ${listing.country}`

  return (
    <div className="min-h-screen">
      <DashboardHeader title={title} subtitle={`${location} • Performance insights`} />
      <div className="p-6">
        <ListingPerformance listingId={id} />
      </div>
    </div>
  )
}
