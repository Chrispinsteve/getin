"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, ImagePlus, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export interface Message {
  id: string
  content: string
  senderId: string
  senderType: "guest" | "host"
  createdAt: Date
  read?: boolean
}

interface GuestMessagingProps {
  messages: Message[]
  host: {
    id: string
    name: string
    avatar?: string
  }
  booking: {
    id: string
    listingTitle: string
  }
  currentUserId: string
  onSendMessage: (content: string) => Promise<void>
  onBack?: () => void
}

export function GuestMessaging({
  messages,
  host,
  booking,
  currentUserId,
  onSendMessage,
  onBack,
}: GuestMessagingProps) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await onSendMessage(newMessage.trim())
      setNewMessage("")
    } finally {
      setSending(false)
    }
  }

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""

    msgs.forEach((msg) => {
      const msgDate = format(new Date(msg.createdAt), "yyyy-MM-dd")
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-3 shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={host.avatar} />
          <AvatarFallback>
            {host.name.split(" ").map((n) => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{host.name}</p>
          <p className="text-xs text-muted-foreground truncate">{booking.listingTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <span className="bg-secondary px-3 py-1 rounded-full text-xs text-muted-foreground">
                {format(new Date(group.date), "EEEE d MMMM", { locale: fr })}
              </span>
            </div>

            {/* Messages for this date */}
            <div className="space-y-3">
              {group.messages.map((message) => {
                const isOwnMessage = message.senderType === "guest"

                return (
                  <div
                    key={message.id}
                    className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                  >
                    <div className="flex gap-2 max-w-[80%]">
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={host.avatar} />
                          <AvatarFallback className="text-xs">
                            {host.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            "text-[10px] mt-1",
                            isOwnMessage
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {format(new Date(message.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={sending}
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  )
}
