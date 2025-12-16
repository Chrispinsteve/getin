import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - List notifications
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
    const unreadOnly = searchParams.get("unread") === "true"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (unreadOnly) {
      query = query.eq("is_read", false)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error, count } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch notifications" },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    return NextResponse.json({
      success: true,
      data: notifications,
      total: count || 0,
      unread_count: unreadCount || 0,
      page,
      limit,
      has_more: (offset + (notifications?.length || 0)) < (count || 0),
    })
  } catch (error) {
    console.error("Notifications error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
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
    const { notification_ids, mark_all } = body

    if (mark_all) {
      // Mark all as read
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false)

      if (error) {
        console.error("Error marking notifications:", error)
        return NextResponse.json(
          { success: false, error: "Failed to mark notifications" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      })
    }

    if (notification_ids && notification_ids.length > 0) {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .in("id", notification_ids)

      if (error) {
        console.error("Error marking notifications:", error)
        return NextResponse.json(
          { success: false, error: "Failed to mark notifications" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `${notification_ids.length} notification(s) marked as read`,
      })
    }

    return NextResponse.json(
      { success: false, error: "No notifications specified" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Mark notifications error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete notifications
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
    const notificationId = searchParams.get("id")
    const deleteAll = searchParams.get("all") === "true"
    const deleteRead = searchParams.get("read") === "true"

    if (deleteAll) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to delete notifications" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "All notifications deleted",
      })
    }

    if (deleteRead) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("is_read", true)

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to delete notifications" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Read notifications deleted",
      })
    }

    if (notificationId) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", user.id)

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to delete notification" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: "Notification deleted",
      })
    }

    return NextResponse.json(
      { success: false, error: "No notification specified" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Delete notification error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
