import { createClient } from "@/lib/supabase/server"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { TripList } from "@/components/guest/trips/trip-list"

export const metadata = {
  title: "Mes Voyages | GetIn",
  description: "Gérez vos réservations et voyages",
}

export default async function VoyagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user's bookings with listing details
  const { data: bookings } = await supabase
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
        images
      )
    `)
    .eq("guest_id", user?.id)
    .order("check_in", { ascending: false })

  const trips = (bookings || []).map((booking: any) => ({
    id: booking.id,
    listing: {
      id: booking.listing?.id || "",
      title: booking.listing?.title || "Logement",
      location: booking.listing?.location || "",
      images: booking.listing?.images || [],
    },
    checkIn: new Date(booking.check_in),
    checkOut: new Date(booking.check_out),
    guests: booking.guests,
    status: booking.status,
    totalPrice: booking.total_price,
  }))

  return (
    <div className="min-h-screen">
      <GuestHeader title="Mes Voyages" showNotifications />
      
      <div className="p-4">
        <TripList trips={trips} />
      </div>
    </div>
  )
}
