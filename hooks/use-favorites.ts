"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface FavoriteListing {
  id: string
  listingId: string
  title: string
  location: string
  pricePerNight: number
  images: string[]
  rating?: number
  reviewCount?: number
  addedAt: Date
}

export function useFavorites() {
  const supabase = createClient()
  const [favorites, setFavorites] = useState<FavoriteListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setFavorites([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from("favorites")
        .select(`
          id,
          listing_id,
          created_at,
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

      if (fetchError) throw fetchError

      const formattedFavorites: FavoriteListing[] = (data || []).map((fav: any) => ({
        id: fav.id,
        listingId: fav.listing?.id || "",
        title: fav.listing?.title || "",
        location: fav.listing?.location || "",
        pricePerNight: fav.listing?.price_per_night || 0,
        images: fav.listing?.images || [],
        rating: fav.listing?.average_rating,
        reviewCount: fav.listing?.review_count,
        addedAt: new Date(fav.created_at),
      }))

      setFavorites(formattedFavorites)
      setError(null)
    } catch (err) {
      console.error("Error fetching favorites:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch favorites"))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const addFavorite = async (listingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          listing_id: listingId,
        })

      if (error) throw error

      // Refetch to get full listing details
      await fetchFavorites()
      return { success: true }
    } catch (err) {
      console.error("Error adding favorite:", err)
      return { success: false, error: err }
    }
  }

  const removeFavorite = async (listingId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId)

      if (error) throw error

      // Optimistic update
      setFavorites((prev) => prev.filter((f) => f.listingId !== listingId))
      return { success: true }
    } catch (err) {
      console.error("Error removing favorite:", err)
      return { success: false, error: err }
    }
  }

  const toggleFavorite = async (listingId: string) => {
    const isFavorited = favorites.some((f) => f.listingId === listingId)
    
    if (isFavorited) {
      return removeFavorite(listingId)
    } else {
      return addFavorite(listingId)
    }
  }

  const isFavorite = (listingId: string) => {
    return favorites.some((f) => f.listingId === listingId)
  }

  return {
    favorites,
    loading,
    error,
    refetch: fetchFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    count: favorites.length,
  }
}
