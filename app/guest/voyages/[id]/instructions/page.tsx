import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { InstructionsCard } from "@/components/guest/trips/instructions-card"
import { differenceInHours } from "date-fns"

interface InstructionsPageProps {
  params: { id: string }
}

export const metadata = {
  title: "Instructions d'arrivée | GetIn",
}

export default async function InstructionsPage({ params }: InstructionsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      id,
      check_in,
      check_out,
      status,
      listing_id,
      listing:listings (
        id,
        title,
        address,
        check_in_instructions
      )
    `)
    .eq("id", params.id)
    .eq("guest_id", user?.id)
    .single()

  if (error || !booking) {
    notFound()
  }

  // Check if instructions should be unlocked (48h before check-in or active booking)
  const checkInDate = new Date(booking.check_in)
  const now = new Date()
  const hoursUntilCheckIn = differenceInHours(checkInDate, now)
  const canViewInstructions = hoursUntilCheckIn <= 48 || booking.status === "active"

  if (!canViewInstructions) {
    redirect(`/voyages/${params.id}`)
  }

  // Fetch check-in instructions
  const { data: instructionsData } = await supabase
    .from("check_in_instructions")
    .select("*")
    .eq("listing_id", booking.listing_id)
    .single()

  const instructions = {
    address: booking.listing?.address || instructionsData?.address || "",
    checkInTime: instructionsData?.check_in_time || "15:00",
    checkOutTime: instructionsData?.check_out_time || "11:00",
    wifiName: instructionsData?.wifi_name,
    wifiPassword: instructionsData?.wifi_password,
    doorCode: instructionsData?.door_code,
    specialInstructions: instructionsData?.special_instructions || booking.listing?.check_in_instructions,
    emergencyContact: instructionsData?.emergency_contact,
    houseRules: instructionsData?.house_rules || [],
  }

  return (
    <div className="min-h-screen">
      <GuestHeader 
        title="Instructions d'arrivée" 
        showBack 
      />
      
      <div className="p-4">
        <InstructionsCard instructions={instructions} />
      </div>
    </div>
  )
}
