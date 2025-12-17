"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderType: "guest" | "host"
  content: string
  createdAt: Date
  readAt?: Date
}

export interface Conversation {
  id: string
  bookingId: string
  hostId: string
  hostName: string
  hostAvatar?: string
  listingTitle: string
  lastMessage?: string
  lastMessageAt?: Date
  unreadCount: number
}

export function useGuestMessages(conversationId?: string) {
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select(`
          id,
          booking_id,
          host_id,
          host:profiles!host_id (
            full_name,
            avatar_url
          ),
          booking:bookings (
            listing:listings (
              title
            )
          ),
          messages (
            content,
            created_at,
            read_at,
            sender_id
          )
        `)
        .eq("guest_id", user.id)
        .order("updated_at", { ascending: false })

      if (fetchError) throw fetchError

      const formattedConversations: Conversation[] = (data || []).map((conv: any) => {
        const sortedMessages = (conv.messages || []).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const lastMsg = sortedMessages[0]
        const unreadCount = (conv.messages || []).filter(
          (m: any) => m.sender_id !== user.id && !m.read_at
        ).length

        return {
          id: conv.id,
          bookingId: conv.booking_id,
          hostId: conv.host_id,
          hostName: conv.host?.full_name || "Hôte",
          hostAvatar: conv.host?.avatar_url,
          listingTitle: conv.booking?.listing?.title || "",
          lastMessage: lastMsg?.content,
          lastMessageAt: lastMsg ? new Date(lastMsg.created_at) : undefined,
          unreadCount,
        }
      })

      setConversations(formattedConversations)
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch conversations"))
    }
  }, [supabase])

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })

      if (fetchError) throw fetchError

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderType: msg.sender_id === user.id ? "guest" : "host",
        content: msg.content,
        createdAt: new Date(msg.created_at),
        readAt: msg.read_at ? new Date(msg.read_at) : undefined,
      }))

      setMessages(formattedMessages)
      setError(null)

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .neq("sender_id", user.id)
        .is("read_at", null)
    } catch (err) {
      console.error("Error fetching messages:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch messages"))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Send a message
  const sendMessage = async (content: string, convId?: string) => {
    try {
      const targetConvId = convId || conversationId
      if (!targetConvId) throw new Error("No conversation selected")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: targetConvId,
          sender_id: user.id,
          content,
        })
        .select()
        .single()

      if (error) throw error

      // Optimistic update
      const newMessage: Message = {
        id: data.id,
        conversationId: targetConvId,
        senderId: user.id,
        senderType: "guest",
        content,
        createdAt: new Date(data.created_at),
      }

      setMessages((prev) => [...prev, newMessage])

      // Update conversation's last message
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", targetConvId)

      return { success: true, message: newMessage }
    } catch (err) {
      console.error("Error sending message:", err)
      return { success: false, error: err }
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchConversations()
    if (conversationId) {
      fetchMessages(conversationId)
    } else {
      setLoading(false)
    }
  }, [fetchConversations, fetchMessages, conversationId])

  // Real-time subscription for messages
  useEffect(() => {
    if (!conversationId) return

    let channel: RealtimeChannel | null = null

    async function setupSubscription() {
      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as any
            if (newMsg.sender_id !== currentUserId) {
              setMessages((prev) => [
                ...prev,
                {
                  id: newMsg.id,
                  conversationId: newMsg.conversation_id,
                  senderId: newMsg.sender_id,
                  senderType: "host",
                  content: newMsg.content,
                  createdAt: new Date(newMsg.created_at),
                },
              ])
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, conversationId, currentUserId])

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return {
    conversations,
    messages,
    loading,
    error,
    currentUserId,
    totalUnread,
    fetchConversations,
    fetchMessages,
    sendMessage,
  }
}
