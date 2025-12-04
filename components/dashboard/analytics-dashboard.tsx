"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { TrendingUp, Calendar, Star, Eye } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const bookingTrends = [
  { month: "Jan", bookings: 8 },
  { month: "Feb", bookings: 12 },
  { month: "Mar", bookings: 15 },
  { month: "Apr", bookings: 10 },
  { month: "May", bookings: 18 },
  { month: "Jun", bookings: 22 },
  { month: "Jul", bookings: 28 },
  { month: "Aug", bookings: 25 },
  { month: "Sep", bookings: 20 },
  { month: "Oct", bookings: 24 },
  { month: "Nov", bookings: 19 },
  { month: "Dec", bookings: 26 },
]

const revenueByProperty = [
  { property: "Downtown Loft", revenue: 12400 },
  { property: "Beach Villa", revenue: 18500 },
  { property: "Mountain Cabin", revenue: 8900 },
  { property: "Cozy Studio", revenue: 4200 },
]

const occupancyData = [
  { name: "Occupied", value: 78, color: "hsl(var(--primary))" },
  { name: "Available", value: 22, color: "hsl(var(--muted))" },
]

const topListings = [
  {
    id: 1,
    title: "Beachfront Villa",
    views: 2847,
    bookings: 28,
    revenue: "$18,500",
    rating: 4.9,
  },
  {
    id: 2,
    title: "Modern Downtown Loft",
    views: 2134,
    bookings: 24,
    revenue: "$12,400",
    rating: 4.8,
  },
  {
    id: 3,
    title: "Mountain Cabin Retreat",
    views: 1456,
    bookings: 18,
    revenue: "$8,900",
    rating: 4.7,
  },
  {
    id: 4,
    title: "Cozy Studio Apartment",
    views: 892,
    bookings: 12,
    revenue: "$4,200",
    rating: 4.5,
  },
]

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Occupancy Rate"
          value="78%"
          change="+5% vs last month"
          changeType="positive"
          icon={Calendar}
        />
        <StatsCard title="Total Bookings" value="227" change="+23% this year" changeType="positive" icon={TrendingUp} />
        <StatsCard title="Average Rating" value="4.8" change="Across all listings" changeType="neutral" icon={Star} />
        <StatsCard title="Total Views" value="7,329" change="+12% this month" changeType="positive" icon={Eye} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrends}>
                  <XAxis
                    dataKey="month"
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
                    dataKey="bookings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Occupancy Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[280px] items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue by Property</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByProperty} layout="vertical">
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <YAxis
                  type="category"
                  dataKey="property"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Performing Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topListings.map((listing, index) => (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{listing.title}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{listing.views.toLocaleString()} views</span>
                      <span>{listing.bookings} bookings</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{listing.revenue}</p>
                  <div className="flex items-center justify-end gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm font-medium">{listing.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
