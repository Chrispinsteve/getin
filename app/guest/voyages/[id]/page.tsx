import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { TripDetail } from "@/components/guest/trips/trip-detail"

interface TripDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: TripDetailPageProps) {
  const supabase = await createClient()
  const { data: booking } = await supabase
    .from("bookings")
    .select("listing:listings(title)")
    .eq("id", params.id)
    .single()

  return {
    title: `${booking?.listing?.title || "Voyage"} | GetIn`,
  }
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch booking with full details
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      id,
      check_in,
      check_out,
      guests,
      status,
      total_price,
      listing:listings (
        id,
        title,
        location,
        address,
        images
      ),
      host:listings!inner(
        host:profiles!host_id (
          id,
          full_name,
          avatar_url,
          phone
        )
      )
    `)
    .eq("id", params.id)
    .eq("guest_id", user?.id)
    .single()

  if (error || !booking) {
    notFound()
  }

  // Check if user has reviewed this booking
  const { data: review } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", params.id)
    .eq("reviewer_id", user?.id)
    .single()

  const bookingData = {
    id: booking.id,
    status: booking.status,
    checkIn: new Date(booking.check_in),
    checkOut: new Date(booking.check_out),
    guests: booking.guests,
    totalPrice: booking.total_price,
    listing: {
      id: booking.listing?.id || "",
      title: booking.listing?.title || "",
      location: booking.listing?.location || "",
      address: booking.listing?.address,
      images: booking.listing?.images || [],
    },
    host: {
      id: booking.host?.host?.id || "",
      name: booking.host?.host?.full_name || "Hôte",
      avatar: booking.host?.host?.avatar_url,
      phone: booking.host?.host?.phone,
    },
    hasReview: !!review,
  }

  return (
    <div className="min-h-screen">
      <GuestHeader showBack />
      
      <div className="p-4">
        <TripDetail booking={bookingData} />
      </div>
    </div>
  )
}
