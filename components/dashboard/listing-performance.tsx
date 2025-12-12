"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Eye, CalendarCheck, DollarSign, Users } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"

const viewsData = [
  { day: "Mon", views: 45 },
  { day: "Tue", views: 52 },
  { day: "Wed", views: 38 },
  { day: "Thu", views: 65 },
  { day: "Fri", views: 78 },
  { day: "Sat", views: 92 },
  { day: "Sun", views: 85 },
]

const checkInData = [
  { time: "6AM", count: 2 },
  { time: "9AM", count: 5 },
  { time: "12PM", count: 8 },
  { time: "3PM", count: 15 },
  { time: "6PM", count: 12 },
  { time: "9PM", count: 4 },
]

interface ListingPerformanceProps {
  listingId?: string
}

export function ListingPerformance({ listingId }: ListingPerformanceProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Views" value="1,284" change="+12% this week" changeType="positive" icon={Eye} />
        <StatsCard title="Total Bookings" value="24" change="8 this month" changeType="neutral" icon={CalendarCheck} />
        <StatsCard
          title="Total Earnings"
          value="$3,048"
          change="+18% this month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard title="Unique Visitors" value="892" change="+5% this week" changeType="positive" icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={viewsData}>
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Check-in Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkInData}>
                  <XAxis
                    dataKey="time"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
