import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { BookingConfirmation } from "@/components/guest/booking/booking-confirmation"

interface ConfirmPageProps {
  params: { id: string }
  searchParams: { 
    listing: string
    checkIn: string
    checkOut: string
    guests: string 
  }
}

export const metadata = {
  title: "Confirmer la réservation | GetIn",
}

export default async function ConfirmPage({ params, searchParams }: ConfirmPageProps) {
  const supabase = await createClient()
  
  const listingId = searchParams.listing
  const checkIn = searchParams.checkIn
  const checkOut = searchParams.checkOut
  const guests = parseInt(searchParams.guests) || 1

  if (!listingId || !checkIn || !checkOut) {
    notFound()
  }

  // Fetch listing details
  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      location,
      price_per_night,
      cleaning_fee,
      images,
      cancellation_policy,
      host:profiles!host_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("id", listingId)
    .single()

  if (error || !listing) {
    notFound()
  }

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

  const bookingData = {
    listing: {
      id: listing.id,
      title: listing.title,
      location: listing.location,
      image: listing.images?.[0] || "",
      pricePerNight: listing.price_per_night,
      cleaningFee: listing.cleaning_fee || 0,
      cancellationPolicy: listing.cancellation_policy || "flexible",
    },
    host: {
      name: listing.host?.full_name || "Hôte",
      avatar: listing.host?.avatar_url,
    },
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests,
    nights,
  }

  return (
    <div className="min-h-screen">
      <GuestHeader title="Confirmer et payer" showBack />
      
      <div className="p-4">
        <BookingConfirmation data={bookingData} />
      </div>
    </div>
  )
}
