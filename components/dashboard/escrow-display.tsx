"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Shield, Clock, CheckCircle, DollarSign, Percent, CreditCard, AlertCircle } from "lucide-react"

const escrowItems = [
  {
    id: 1,
    booking: "Sarah M. - Modern Downtown Loft",
    amount: "$381",
    checkIn: "Dec 15, 2024",
    holdUntil: "Dec 16, 2024",
    status: "pending",
    platformFee: "$57.15",
    processingFee: "$11.05",
    netAmount: "$312.80",
  },
  {
    id: 2,
    booking: "Michael K. - Beachfront Villa",
    amount: "$1,250",
    checkIn: "Dec 20, 2024",
    holdUntil: "Dec 21, 2024",
    status: "pending",
    platformFee: "$187.50",
    processingFee: "$36.55",
    netAmount: "$1,025.95",
  },
  {
    id: 3,
    booking: "Emma L. - Mountain Cabin",
    amount: "$890",
    checkIn: "Dec 10, 2024",
    holdUntil: "Dec 11, 2024",
    status: "released",
    platformFee: "$133.50",
    processingFee: "$26.11",
    netAmount: "$730.39",
  },
]

export function EscrowDisplay() {
  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">How Escrow Works</h3>
              <p className="text-muted-foreground">
                Guest payments are held securely for 24 hours after check-in. This protects both you and your guests,
                ensuring a smooth experience. Once the hold period ends, funds are automatically released to your payout
                method.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">24-hour hold period</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">Automatic release</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Secure protection</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Escrow</p>
                <p className="text-2xl font-bold">$1,631</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <CheckCircle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Released This Month</p>
                <p className="text-2xl font-bold">$2,847</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Percent className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform Fee</p>
                <p className="text-2xl font-bold">15%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Escrow Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {escrowItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/50 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{item.booking}</p>
                    <Badge
                      variant={item.status === "released" ? "default" : "secondary"}
                      className={item.status === "released" ? "bg-accent text-accent-foreground" : ""}
                    >
                      {item.status === "released" ? "Released" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Check-in: {item.checkIn} • Hold until: {item.holdUntil}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{item.amount}</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-2 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Booking Total</p>
                  <p className="font-medium">{item.amount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Platform Fee (15%)</p>
                  <p className="font-medium text-destructive">-{item.platformFee}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Processing Fee</p>
                  <p className="font-medium text-destructive">-{item.processingFee}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Amount</p>
                  <p className="font-semibold text-primary">{item.netAmount}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Fee Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                <p className="font-semibold">Platform Service Fee</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                15% of each booking total. This covers platform maintenance, customer support, and marketing.
              </p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <p className="font-semibold">Payment Processing</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                2.9% + $0.30 per transaction. Standard payment processor fees for secure card processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
