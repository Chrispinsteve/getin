import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const recentBookings = [
  {
    id: 1,
    guest: "Sarah M.",
    property: "Modern Downtown Loft",
    dates: "Dec 15-18",
    status: "pending",
    amount: "$381",
  },
  {
    id: 2,
    guest: "Michael K.",
    property: "Beachfront Villa",
    dates: "Dec 20-25",
    status: "confirmed",
    amount: "$1,250",
  },
  {
    id: 3,
    guest: "Emma L.",
    property: "Mountain Cabin",
    dates: "Dec 28-Jan 2",
    status: "confirmed",
    amount: "$890",
  },
  {
    id: 4,
    guest: "James R.",
    property: "Modern Downtown Loft",
    dates: "Jan 5-8",
    status: "completed",
    amount: "$508",
  },
]

export function RecentBookings() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentBookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`/.jpg?height=40&width=40&query=${booking.guest} avatar`} />
                <AvatarFallback>
                  {booking.guest
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{booking.guest}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.property} • {booking.dates}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  booking.status === "confirmed" ? "default" : booking.status === "pending" ? "secondary" : "outline"
                }
                className={booking.status === "confirmed" ? "bg-accent text-accent-foreground" : ""}
              >
                {booking.status}
              </Badge>
              <span className="font-semibold">{booking.amount}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
