"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { GuestMessaging, type Message } from "@/components/guest/messaging/guest-messaging"
import { Skeleton } from "@/components/ui/skeleton"

interface MessagesPageProps {
  params: { id: string }
}

export default function MessagesPage({ params }: MessagesPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [booking, setBooking] = useState<any>(null)
  const [host, setHost] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [conversationId, setConversationId] = useState<string>("")

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      // Fetch booking with host details
      const { data: bookingData } = await supabase
        .from("bookings")
        .select(`
          id,
          listing:listings (
            id,
            title,
            host_id,
            host:profiles!host_id (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq("id", params.id)
        .eq("guest_id", user.id)
        .single()

      if (!bookingData) {
        router.push("/voyages")
        return
      }

      setBooking({
        id: bookingData.id,
        listingTitle: bookingData.listing?.title || "",
      })

      setHost({
        id: bookingData.listing?.host?.id || "",
        name: bookingData.listing?.host?.full_name || "Hôte",
        avatar: bookingData.listing?.host?.avatar_url,
      })

      // Get or create conversation
      let { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("booking_id", params.id)
        .single()

      if (!conversation) {
        const { data: newConversation } = await supabase
          .from("conversations")
          .insert({
            booking_id: params.id,
            guest_id: user.id,
            host_id: bookingData.listing?.host_id,
          })
          .select("id")
          .single()
        conversation = newConversation
      }

      if (conversation) {
        setConversationId(conversation.id)

        // Fetch messages
        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true })

        setMessages(
          (messagesData || []).map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.sender_id,
            senderType: msg.sender_id === user.id ? "guest" : "host",
            createdAt: new Date(msg.created_at),
            read: !!msg.read_at,
          }))
        )
      }

      setLoading(false)
    }

    loadData()
  }, [params.id, router, supabase])

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
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
          const newMessage = payload.new as any
          setMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              content: newMessage.content,
              senderId: newMessage.sender_id,
              senderType: newMessage.sender_id === currentUserId ? "guest" : "host",
              createdAt: new Date(newMessage.created_at),
              read: false,
            },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId, supabase])

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <GuestHeader title="Messages" showBack />
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col">
        <GuestMessaging
          messages={messages}
          host={host}
          booking={booking}
          currentUserId={currentUserId}
          onSendMessage={handleSendMessage}
          onBack={() => router.back()}
        />
      </div>
    </div>
  )
}
