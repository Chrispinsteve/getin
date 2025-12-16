import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get("check_in")
    const checkOut = searchParams.get("check_out")

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: "check_in and check_out dates are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify listing exists and is published
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, blocked_dates, min_stay, max_stay")
      .eq("id", id)
      .eq("status", "published")
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      )
    }

    // Calculate number of nights
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check min/max stay
    if (listing.min_stay && nights < listing.min_stay) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: `Minimum stay is ${listing.min_stay} nights`,
        },
      })
    }

    if (listing.max_stay && nights > listing.max_stay) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: `Maximum stay is ${listing.max_stay} nights`,
        },
      })
    }

    // Check blocked dates
    if (listing.blocked_dates && listing.blocked_dates.length > 0) {
      for (const blockedDate of listing.blocked_dates) {
        const blocked = new Date(blockedDate)
        if (blocked >= checkInDate && blocked < checkOutDate) {
          return NextResponse.json({
            success: true,
            data: {
              available: false,
              reason: "Some dates are blocked by the host",
            },
          })
        }
      }
    }

    // Check existing bookings
    const { data: conflictingBookings } = await supabase
      .from("bookings")
      .select("id, check_in, check_out")
      .eq("listing_id", id)
      .in("status", ["pending", "accepted", "confirmed"])
      .or(`and(check_in.lt.${checkOut},check_out.gt.${checkIn})`)

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: "These dates are already booked",
          conflicting_dates: conflictingBookings.map(b => ({
            check_in: b.check_in,
            check_out: b.check_out,
          })),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        available: true,
        nights,
      },
    })
  } catch (error) {
    console.error("Availability check error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get blocked dates and booked dates for a listing (for calendar display)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { start_date, end_date } = body

    const supabase = await createClient()

    // Get listing with blocked dates
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("blocked_dates, min_stay, max_stay")
      .eq("id", id)
      .eq("status", "published")
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      )
    }

    // Get booked dates within range
    let bookingsQuery = supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("listing_id", id)
      .in("status", ["pending", "accepted", "confirmed"])

    if (start_date) {
      bookingsQuery = bookingsQuery.gte("check_out", start_date)
    }
    if (end_date) {
      bookingsQuery = bookingsQuery.lte("check_in", end_date)
    }

    const { data: bookings } = await bookingsQuery

    // Generate list of unavailable dates
    const unavailableDates: string[] = []

    // Add blocked dates
    if (listing.blocked_dates) {
      unavailableDates.push(...listing.blocked_dates)
    }

    // Add booked dates
    if (bookings) {
      for (const booking of bookings) {
        const start = new Date(booking.check_in)
        const end = new Date(booking.check_out)
        
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          unavailableDates.push(d.toISOString().split("T")[0])
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        unavailable_dates: [...new Set(unavailableDates)].sort(),
        min_stay: listing.min_stay,
        max_stay: listing.max_stay,
        bookings: bookings?.map(b => ({
          check_in: b.check_in,
          check_out: b.check_out,
        })) || [],
      },
    })
  } catch (error) {
    console.error("Get unavailable dates error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
