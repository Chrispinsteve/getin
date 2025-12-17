"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { FavoritesGrid, type FavoriteListingProps } from "@/components/guest/profile/favorites-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function FavorisPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteListingProps[]>([])

  useEffect(() => {
    loadFavorites()
  }, [])

  async function loadFavorites() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("favorites")
      .select(`
        listing_id,
        listing:listings (
          id,
          title,
          location,
          price_per_night,
          images,
          average_rating,
          review_count
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const formattedFavorites = (data || []).map((fav: any) => ({
      id: fav.listing?.id || "",
      title: fav.listing?.title || "",
      location: fav.listing?.location || "",
      pricePerNight: fav.listing?.price_per_night || 0,
      rating: fav.listing?.average_rating,
      reviewCount: fav.listing?.review_count,
      images: fav.listing?.images || [],
      isFavorite: true,
    }))

    setFavorites(formattedFavorites)
    setLoading(false)
  }

  const handleToggleFavorite = async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Optimistic update
    setFavorites((prev) => prev.filter((f) => f.id !== listingId))

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId)

    if (error) {
      toast.error("Erreur lors de la suppression du favori")
      loadFavorites() // Reload on error
    } else {
      toast.success("Retiré des favoris")
    }
  }

  return (
    <div className="min-h-screen">
      <GuestHeader title="Favoris" showNotifications />
      
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
            ))}
          </div>
        ) : (
          <FavoritesGrid 
            listings={favorites}
            onToggleFavorite={handleToggleFavorite}
            emptyMessage="Enregistrez vos logements préférés pour les retrouver facilement"
          />
        )}
      </div>
    </div>
  )
}
