"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Check, X, MessageSquare, Calendar, Users, Home } from "lucide-react"
import Link from "next/link"

const bookingData = {
  id: 1,
  status: "pending",
  guest: {
    name: "Sarah Martinez",
    email: "sarah.m@email.com",
    phone: "+1 (555) 123-4567",
    memberSince: "2023",
    reviews: 8,
  },
  property: "Modern Downtown Loft",
  checkIn: "December 15, 2024",
  checkOut: "December 18, 2024",
  nights: 3,
  guests: 2,
  pricing: {
    nightlyRate: 127,
    nights: 3,
    subtotal: 381,
    serviceFee: 57,
    total: 438,
  },
}

export function BookingDetails() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={bookingData.status === "pending" ? "secondary" : "default"} className="text-sm">
          {bookingData.status.charAt(0).toUpperCase() + bookingData.status.slice(1)}
        </Badge>
        {bookingData.status === "pending" && (
          <div className="flex gap-3">
            <Button className="gap-2">
              <Check className="h-4 w-4" />
              Accept Booking
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <X className="h-4 w-4" />
              Decline
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle>Guest Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/sarah-woman-avatar.jpg" />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{bookingData.guest.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Member since {bookingData.guest.memberSince} • {bookingData.guest.reviews} reviews
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{bookingData.guest.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="font-medium">{bookingData.guest.phone}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-2 bg-transparent" asChild>
              <Link href="/dashboard/messages">
                <MessageSquare className="h-4 w-4" />
                Message Guest
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-medium">{bookingData.property}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dates</p>
                <p className="font-medium">
                  {bookingData.checkIn} - {bookingData.checkOut}
                </p>
                <p className="text-sm text-muted-foreground">{bookingData.nights} nights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p className="font-medium">{bookingData.guests} guests</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  ${bookingData.pricing.nightlyRate} x {bookingData.pricing.nights} nights
                </span>
                <span>${bookingData.pricing.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service fee</span>
                <span>${bookingData.pricing.serviceFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">${bookingData.pricing.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
