import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendMessageSchema, startConversationSchema } from "@/lib/validations/guest"

// GET - List conversations
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
    const conversationId = searchParams.get("conversation_id")

    // If conversation_id provided, get messages for that conversation
    if (conversationId) {
      // Verify user is part of this conversation
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id, guest_id")
        .eq("id", conversationId)
        .eq("guest_id", user.id)
        .single()

      if (!conversation) {
        return NextResponse.json(
          { success: false, error: "Conversation not found" },
          { status: 404 }
        )
      }

      // Get messages
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!sender_id(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching messages:", error)
        return NextResponse.json(
          { success: false, error: "Failed to fetch messages" },
          { status: 500 }
        )
      }

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("recipient_id", user.id)
        .is("read_at", null)

      // Reset unread count
      await supabase
        .from("conversations")
        .update({ guest_unread_count: 0 })
        .eq("id", conversationId)

      return NextResponse.json({ success: true, data: messages })
    }

    // Otherwise, list all conversations
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        *,
        listing:listings(
          id,
          title,
          photos,
          city
        ),
        host:hosts(
          id,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq("guest_id", user.id)
      .eq("guest_archived", false)
      .order("last_message_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      return NextResponse.json(
        { success: false, error: "Failed to fetch conversations" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: conversations })
  } catch (error) {
    console.error("Messages error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Send message or start conversation
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
    const action = body.action // 'send' or 'start'

    if (action === "start") {
      const validation = startConversationSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: validation.error.flatten() },
          { status: 400 }
        )
      }

      const data = validation.data

      // Get listing and host info
      const { data: listing } = await supabase
        .from("listings")
        .select("id, title, host:hosts(id, user_id)")
        .eq("id", data.listing_id)
        .single()

      if (!listing || !listing.host) {
        return NextResponse.json(
          { success: false, error: "Listing not found" },
          { status: 404 }
        )
      }

      // Check for existing conversation
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", data.listing_id)
        .eq("guest_id", user.id)
        .eq("host_id", listing.host.id)
        .single()

      let conversationId = existingConversation?.id

      if (!conversationId) {
        // Create new conversation
        const { data: newConversation, error: convError } = await supabase
          .from("conversations")
          .insert({
            listing_id: data.listing_id,
            host_id: listing.host.id,
            guest_id: user.id,
            booking_id: data.booking_id || null,
            subject: data.subject || `Inquiry about ${listing.title}`,
            conversation_type: data.booking_id ? "booking" : "inquiry",
          })
          .select()
          .single()

        if (convError) {
          console.error("Error creating conversation:", convError)
          return NextResponse.json(
            { success: false, error: "Failed to start conversation" },
            { status: 500 }
          )
        }

        conversationId = newConversation.id
      }

      // Send the first message
      const { data: message, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          recipient_id: listing.host.user_id,
          message_text: data.message,
          message_type: "text",
        })
        .select()
        .single()

      if (msgError) {
        console.error("Error sending message:", msgError)
        return NextResponse.json(
          { success: false, error: "Failed to send message" },
          { status: 500 }
        )
      }

      // Update conversation
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: data.message.substring(0, 100),
          host_unread_count: 1,
        })
        .eq("id", conversationId)

      // Create notification for host
      await supabase.from("notifications").insert({
        user_id: listing.host.user_id,
        type: "message_received",
        title: "Nouveau message",
        message: `Vous avez reçu un message concernant ${listing.title}`,
        data: { conversation_id: conversationId, listing_id: listing.id },
        action_url: `/dashboard/messages/${conversationId}`,
      })

      return NextResponse.json({
        success: true,
        data: { conversation_id: conversationId, message },
      }, { status: 201 })
    }

    // Send message to existing conversation
    const validation = sendMessageSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify user is part of conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, guest_id, host:hosts(user_id)")
      .eq("id", data.conversation_id)
      .eq("guest_id", user.id)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      )
    }

    // Send message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        sender_id: user.id,
        recipient_id: conversation.host?.user_id,
        message_text: data.message_text,
        message_type: data.message_type || "text",
        attachments: data.attachments || [],
      })
      .select()
      .single()

    if (msgError) {
      console.error("Error sending message:", msgError)
      return NextResponse.json(
        { success: false, error: "Failed to send message" },
        { status: 500 }
      )
    }

    // Update conversation
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: data.message_text.substring(0, 100),
        host_unread_count: supabase.rpc("increment", { x: 1 }),
      })
      .eq("id", data.conversation_id)

    // Create notification
    await supabase.from("notifications").insert({
      user_id: conversation.host?.user_id,
      type: "message_received",
      title: "Nouveau message",
      message: data.message_text.substring(0, 50) + "...",
      data: { conversation_id: data.conversation_id },
      action_url: `/dashboard/messages/${data.conversation_id}`,
    })

    return NextResponse.json({ success: true, data: message })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Archive conversation
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
    const { conversation_id, archive } = body

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: "Conversation ID required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("conversations")
      .update({ guest_archived: archive ?? true })
      .eq("id", conversation_id)
      .eq("guest_id", user.id)

    if (error) {
      console.error("Error archiving conversation:", error)
      return NextResponse.json(
        { success: false, error: "Failed to update conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: archive ? "Conversation archived" : "Conversation unarchived",
    })
  } catch (error) {
    console.error("Archive conversation error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
