"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, CreditCard, Percent } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const revenueData = [
  { month: "Jan", revenue: 2400 },
  { month: "Feb", revenue: 1398 },
  { month: "Mar", revenue: 3200 },
  { month: "Apr", revenue: 2780 },
  { month: "May", revenue: 1890 },
  { month: "Jun", revenue: 3240 },
  { month: "Jul", revenue: 3490 },
  { month: "Aug", revenue: 4100 },
  { month: "Sep", revenue: 3800 },
  { month: "Oct", revenue: 4200 },
  { month: "Nov", revenue: 3900 },
  { month: "Dec", revenue: 4500 },
]

const payoutHistory = [
  {
    id: 1,
    date: "Dec 1, 2024",
    amount: "$2,847.50",
    status: "completed",
    method: "MonCash",
  },
  {
    id: 2,
    date: "Nov 15, 2024",
    amount: "$3,124.00",
    status: "completed",
    method: "PayPal",
  },
  {
    id: 3,
    date: "Nov 1, 2024",
    amount: "$2,456.75",
    status: "completed",
    method: "MonCash",
  },
  {
    id: 4,
    date: "Oct 15, 2024",
    amount: "$3,890.25",
    status: "completed",
    method: "PayPal",
  },
  {
    id: 5,
    date: "Oct 1, 2024",
    amount: "$2,100.00",
    status: "completed",
    method: "MonCash",
  },
]

export function EarningsOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Earnings"
          value="$38,940"
          change="+18% this year"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Upcoming Payouts"
          value="$1,847"
          change="Dec 15, 2024"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatsCard
          title="Platform Fees"
          value="$5,841"
          change="15% of earnings"
          changeType="neutral"
          icon={Percent}
          iconColor="bg-muted text-muted-foreground"
        />
        <StatsCard title="Net Earnings" value="$33,099" change="After fees" changeType="positive" icon={CreditCard} />
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Fee Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
              <div>
                <p className="font-medium">Platform Service Fee</p>
                <p className="text-sm text-muted-foreground">15% of each booking</p>
              </div>
              <p className="text-lg font-semibold">$5,241</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
              <div>
                <p className="font-medium">Payment Processing</p>
                <p className="text-sm text-muted-foreground">2.9% + $0.30 per transaction</p>
              </div>
              <p className="text-lg font-semibold">$600</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
              <p className="font-semibold">Total Fees</p>
              <p className="text-lg font-semibold text-primary">$5,841</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payoutHistory.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div>
                    <p className="font-medium">{payout.amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {payout.date} • {payout.method}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                    {payout.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
