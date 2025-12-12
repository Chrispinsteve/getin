"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, Search, Calendar, Home, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const conversations = [
  {
    id: 1,
    guest: "Sarah Martinez",
    avatar: "/sarah-woman-avatar.jpg",
    lastMessage: "Thank you for the quick response!",
    time: "2 min ago",
    unread: 2,
    booking: {
      property: "Modern Downtown Loft",
      dates: "Dec 15-18",
    },
  },
  {
    id: 2,
    guest: "Michael Kim",
    avatar: "/michael-asian-man-avatar.jpg",
    lastMessage: "Is there parking available?",
    time: "1 hour ago",
    unread: 0,
    booking: {
      property: "Beachfront Villa",
      dates: "Dec 20-25",
    },
  },
  {
    id: 3,
    guest: "Emma Laurent",
    avatar: "/emma-french-woman-avatar.jpg",
    lastMessage: "We had an amazing stay!",
    time: "Yesterday",
    unread: 0,
    booking: {
      property: "Mountain Cabin",
      dates: "Dec 5-8",
    },
  },
  {
    id: 4,
    guest: "James Rodriguez",
    avatar: "/james-latino-man-avatar.jpg",
    lastMessage: "What time is check-in?",
    time: "2 days ago",
    unread: 0,
    booking: {
      property: "Cozy Studio",
      dates: "Jan 5-8",
    },
  },
]

const mockMessages = [
  {
    id: 1,
    sender: "guest",
    content: "Hi! I'm really excited about my upcoming stay. I was wondering if early check-in is possible?",
    time: "10:30 AM",
  },
  {
    id: 2,
    sender: "host",
    content:
      "Hello Sarah! Thank you for reaching out. I'd be happy to arrange an early check-in for you. What time were you thinking?",
    time: "10:35 AM",
  },
  {
    id: 3,
    sender: "guest",
    content: "That would be great! We're arriving around noon. Would 1 PM work?",
    time: "10:38 AM",
  },
  {
    id: 4,
    sender: "host",
    content:
      "1 PM works perfectly! I'll have everything ready for you. Is there anything else you'd like to know about the property?",
    time: "10:42 AM",
  },
  {
    id: 5,
    sender: "guest",
    content: "Thank you for the quick response! That's all for now. See you soon!",
    time: "10:45 AM",
  },
]

export function MessagingInterface() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showChat, setShowChat] = useState(false)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
  }

  const handleSelectConversation = (conv: (typeof conversations)[0]) => {
    setSelectedConversation(conv)
    setShowChat(true)
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.booking.property.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Card className="border-border/50 overflow-hidden h-full">
      <div className="flex h-full">
        <div
          className={cn(
            "w-full border-r border-border md:block md:max-w-xs lg:max-w-sm flex flex-col",
            showChat ? "hidden" : "flex",
          )}
        >
          <div className="border-b border-border p-2 sm:p-3 md:p-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary/50 pl-8 sm:pl-9 text-xs sm:text-sm h-8 sm:h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "flex w-full items-start gap-2 border-b border-border/50 p-2 sm:p-3 md:p-4 text-left transition-colors hover:bg-secondary/50",
                  selectedConversation.id === conv.id && "bg-secondary/50",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12">
                    <AvatarImage src={conv.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {conv.guest
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] sm:text-[10px] text-primary-foreground">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs sm:text-sm md:text-base font-semibold truncate">{conv.guest}</p>
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground shrink-0">
                      {conv.time}
                    </span>
                  </div>
                  <p className="truncate text-[10px] sm:text-xs md:text-sm text-muted-foreground">{conv.lastMessage}</p>
                  <Badge variant="secondary" className="mt-1 text-[9px] sm:text-[10px] md:text-xs px-1.5 py-0">
                    {conv.booking.property}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col min-w-0", showChat ? "flex" : "hidden md:flex")}>
          <div className="flex items-center justify-between border-b border-border p-2 sm:p-3 md:p-4 shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => setShowChat(false)}
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10">
                <AvatarImage src={selectedConversation.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-xs">
                  {selectedConversation.guest
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm md:text-base font-semibold truncate">{selectedConversation.guest}</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Active now</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 md:gap-4 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Home className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                <span className="truncate max-w-[80px] md:max-w-none">{selectedConversation.booking.property}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                <span>{selectedConversation.booking.dates}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 sm:p-3 md:p-4">
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {mockMessages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender === "host" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4",
                      msg.sender === "host" ? "bg-primary text-primary-foreground" : "bg-secondary",
                    )}
                  >
                    <p className="text-[11px] sm:text-xs md:text-sm">{msg.content}</p>
                    <p
                      className={cn(
                        "mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] md:text-xs",
                        msg.sender === "host" ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend} className="border-t border-border p-2 sm:p-3 md:p-4 shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-secondary/50 text-xs sm:text-sm h-8 sm:h-9 md:h-10"
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 shrink-0"
                disabled={!message.trim()}
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  )
}
