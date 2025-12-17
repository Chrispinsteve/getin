"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { ReviewForm, type ReviewData } from "@/components/guest/reviews/review-form"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface ReviewPageProps {
  params: { id: string }
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [listing, setListing] = useState<any>(null)

  useEffect(() => {
    async function loadBooking() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", params.id)
        .eq("reviewer_id", user.id)
        .single()

      if (existingReview) {
        toast.info("Vous avez déjà laissé un avis pour ce séjour")
        router.push(`/voyages/${params.id}`)
        return
      }

      // Fetch booking details
      const { data: booking } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          listing:listings (
            id,
            title,
            host:profiles!host_id (
              id,
              full_name
            )
          )
        `)
        .eq("id", params.id)
        .eq("guest_id", user.id)
        .single()

      if (!booking || booking.status !== "completed") {
        toast.error("Ce voyage n'est pas encore terminé")
        router.push(`/voyages/${params.id}`)
        return
      }

      setListing({
        id: booking.listing?.id,
        title: booking.listing?.title || "",
        hostName: booking.listing?.host?.full_name || "l'hôte",
      })

      setLoading(false)
    }

    loadBooking()
  }, [params.id, router, supabase])

  const handleSubmit = async (data: ReviewData) => {
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      // Get booking to find reviewee (host)
      const { data: booking } = await supabase
        .from("bookings")
        .select("listing:listings(host_id)")
        .eq("id", params.id)
        .single()

      if (!booking?.listing?.host_id) throw new Error("Hôte non trouvé")

      // Create review
      const { error } = await supabase.from("reviews").insert({
        booking_id: params.id,
        reviewer_id: user.id,
        reviewee_id: booking.listing.host_id,
        reviewer_type: "guest",
        overall_rating: data.overallRating,
        cleanliness_rating: data.cleanlinessRating,
        accuracy_rating: data.accuracyRating,
        communication_rating: data.communicationRating,
        location_rating: data.locationRating,
        check_in_rating: data.checkInRating,
        value_rating: data.valueRating,
        public_comment: data.publicComment,
        private_message: data.privateMessage,
      })

      if (error) throw error

      toast.success("Merci pour votre avis!")
      router.push(`/voyages/${params.id}`)
    } catch (error) {
      console.error("Review submission error:", error)
      toast.error("Erreur lors de la publication de l'avis")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <GuestHeader title="Laisser un avis" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GuestHeader title="Laisser un avis" showBack />
      
      <div className="p-4">
        <ReviewForm 
          listing={listing} 
          onSubmit={handleSubmit}
          loading={submitting}
        />
      </div>
    </div>
  )
}
