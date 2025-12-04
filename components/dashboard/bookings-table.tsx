"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, MessageSquare, Calendar, Users } from "lucide-react"
import Link from "next/link"

const allBookings = {
  pending: [
    {
      id: 1,
      guest: "Sarah M.",
      property: "Modern Downtown Loft",
      checkIn: "Dec 15, 2024",
      checkOut: "Dec 18, 2024",
      guests: 2,
      price: "$381",
    },
    {
      id: 2,
      guest: "Alex T.",
      property: "Beachfront Villa",
      checkIn: "Dec 22, 2024",
      checkOut: "Dec 26, 2024",
      guests: 4,
      price: "$1,000",
    },
    {
      id: 3,
      guest: "Maria G.",
      property: "Mountain Cabin",
      checkIn: "Dec 28, 2024",
      checkOut: "Jan 1, 2025",
      guests: 3,
      price: "$712",
    },
  ],
  confirmed: [
    {
      id: 4,
      guest: "Michael K.",
      property: "Beachfront Villa",
      checkIn: "Dec 20, 2024",
      checkOut: "Dec 25, 2024",
      guests: 4,
      price: "$1,250",
    },
    {
      id: 5,
      guest: "Emma L.",
      property: "Mountain Cabin",
      checkIn: "Dec 28, 2024",
      checkOut: "Jan 2, 2025",
      guests: 2,
      price: "$890",
    },
    {
      id: 6,
      guest: "David W.",
      property: "Modern Downtown Loft",
      checkIn: "Jan 5, 2025",
      checkOut: "Jan 8, 2025",
      guests: 2,
      price: "$381",
    },
    {
      id: 7,
      guest: "Lisa P.",
      property: "Cozy Studio",
      checkIn: "Jan 10, 2025",
      checkOut: "Jan 12, 2025",
      guests: 1,
      price: "$170",
    },
    {
      id: 8,
      guest: "Robert H.",
      property: "Beachfront Villa",
      checkIn: "Jan 15, 2025",
      checkOut: "Jan 20, 2025",
      guests: 6,
      price: "$1,250",
    },
  ],
  completed: [
    {
      id: 9,
      guest: "James R.",
      property: "Modern Downtown Loft",
      checkIn: "Nov 10, 2024",
      checkOut: "Nov 13, 2024",
      guests: 2,
      price: "$381",
    },
    {
      id: 10,
      guest: "Sophie B.",
      property: "Beachfront Villa",
      checkIn: "Nov 15, 2024",
      checkOut: "Nov 18, 2024",
      guests: 3,
      price: "$750",
    },
    {
      id: 11,
      guest: "Tom C.",
      property: "Mountain Cabin",
      checkIn: "Nov 20, 2024",
      checkOut: "Nov 22, 2024",
      guests: 2,
      price: "$356",
    },
  ],
}

interface BookingsTableProps {
  status: "pending" | "confirmed" | "completed"
}

export function BookingsTable({ status }: BookingsTableProps) {
  const bookings = allBookings[status]

  return (
    <>
      <div className="space-y-3 md:hidden">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={`/.jpg?height=32&width=32&query=${booking.guest} avatar`} />
                    <AvatarFallback className="text-xs">
                      {booking.guest
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{booking.guest}</p>
                    <p className="text-xs text-muted-foreground truncate">{booking.property}</p>
                  </div>
                </div>
                <p className="font-semibold text-sm text-primary shrink-0">{booking.price}</p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{booking.checkIn}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{booking.checkOut}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{booking.guests} guests</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {status === "pending" && (
                  <>
                    <Button size="sm" className="h-7 gap-1 text-xs flex-1">
                      <Check className="h-3 w-3" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1 text-xs flex-1 bg-transparent">
                      <X className="h-3 w-3" />
                      Decline
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" asChild>
                  <Link href="/dashboard/messages">
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Guest</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Property</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Check-in</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Check-out</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Guests</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/.jpg?height=32&width=32&query=${booking.guest} avatar`} />
                        <AvatarFallback>
                          {booking.guest
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{booking.guest}</span>
                    </div>
                  </td>
                  <td className="p-4">{booking.property}</td>
                  <td className="p-4">{booking.checkIn}</td>
                  <td className="p-4">{booking.checkOut}</td>
                  <td className="p-4">{booking.guests}</td>
                  <td className="p-4 font-semibold">{booking.price}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {status === "pending" && (
                        <>
                          <Button size="sm" className="h-8 gap-1">
                            <Check className="h-3 w-3" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 gap-1 bg-transparent">
                            <X className="h-3 w-3" />
                            Decline
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                        <Link href="/dashboard/messages">
                          <MessageSquare className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  )
}
