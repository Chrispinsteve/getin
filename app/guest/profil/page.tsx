"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { GuestProfile } from "@/components/guest/profile/guest-profile"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function ProfilPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalTrips: 0,
    reviewsGiven: 0,
    averageRating: undefined as number | undefined,
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push("/login")
      return
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (profile) {
      setUser({
        id: profile.id,
        email: authUser.email || "",
        fullName: profile.full_name || "",
        avatar: profile.avatar_url,
        phone: profile.phone,
        location: profile.location,
        memberSince: new Date(profile.created_at),
        verifiedEmail: !!authUser.email_confirmed_at,
        verifiedPhone: profile.phone_verified,
      })
    }

    // Fetch stats
    const { count: tripsCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("guest_id", authUser.id)
      .in("status", ["completed", "active"])

    const { count: reviewsCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("reviewer_id", authUser.id)

    // Get average rating from reviews received
    const { data: ratings } = await supabase
      .from("reviews")
      .select("overall_rating")
      .eq("reviewee_id", authUser.id)

    const avgRating = ratings && ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length
      : undefined

    setStats({
      totalTrips: tripsCount || 0,
      reviewsGiven: reviewsCount || 0,
      averageRating: avgRating,
    })

    setLoading(false)
  }

  const handleUpdateProfile = async (data: Partial<typeof user>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone,
        location: data.location,
      })
      .eq("id", authUser.id)

    if (error) {
      toast.error("Erreur lors de la mise à jour")
    } else {
      toast.success("Profil mis à jour")
      setUser((prev: any) => ({ ...prev, ...data }))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <GuestHeader title="Profil" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <GuestHeader title="Profil" />
      
      <div className="p-4">
        <GuestProfile 
          user={user}
          stats={stats}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}
