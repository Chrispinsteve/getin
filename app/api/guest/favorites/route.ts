import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { addToFavoritesSchema, createCollectionSchema } from "@/lib/validations/guest"

// GET - List favorites
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const collection = searchParams.get("collection")

    let query = supabase
      .from("favorites")
      .select(`
        *,
        listing:listings(
          id,
          title,
          property_type,
          city,
          state,
          country,
          photos,
          base_price,
          average_rating,
          reviews_count,
          instant_book
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (collection) {
      query = query.eq("collection_name", collection)
    }

    const { data: favorites, error } = await query

    if (error) {
      console.error("Error fetching favorites:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch favorites" },
        { status: 500 }
      )
    }

    // Get collections with counts
    const { data: collections } = await supabase
      .from("favorites")
      .select("collection_name")
      .eq("user_id", user.id)

    const collectionCounts: Record<string, number> = {}
    collections?.forEach(f => {
      collectionCounts[f.collection_name] = (collectionCounts[f.collection_name] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: favorites,
      collections: Object.entries(collectionCounts).map(([name, count]) => ({ name, count })),
    })
  } catch (error) {
    console.error("Favorites error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = addToFavoritesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if listing exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title")
      .eq("id", data.listing_id)
      .eq("status", "published")
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      )
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", data.listing_id)
      .single()

    if (existing) {
      // Update existing favorite
      const { data: favorite, error } = await supabase
        .from("favorites")
        .update({
          collection_name: data.collection_name || "Favorites",
          notes: data.notes,
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to update favorite" },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data: favorite, updated: true })
    }

    // Create new favorite
    const { data: favorite, error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        listing_id: data.listing_id,
        collection_name: data.collection_name || "Favorites",
        notes: data.notes,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding favorite:", error)
      return NextResponse.json(
        { success: false, error: "Failed to add favorite" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: favorite }, { status: 201 })
  } catch (error) {
    console.error("Add favorite error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get("listing_id")

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: "Listing ID required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId)

    if (error) {
      console.error("Error removing favorite:", error)
      return NextResponse.json(
        { success: false, error: "Failed to remove favorite" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Removed from favorites" })
  } catch (error) {
    console.error("Remove favorite error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
