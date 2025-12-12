import { DashboardHeader } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { RecentBookings } from "@/components/dashboard/recent-bookings"
import { Home, CalendarDays, DollarSign, TrendingUp } from "lucide-react"
import { getDashboardStats } from "../actions"

export default async function DashboardOverviewPage() {
  const { stats } = await getDashboardStats()

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Welcome back!" subtitle="Here's what's happening with your listings today." />
      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Active Listings"
            value={stats.activeListings.toString()}
            change={stats.activeListings > 0 ? "Published listings" : "No active listings"}
            changeType={stats.activeListings > 0 ? "positive" : "neutral"}
            icon={Home}
          />
          <StatsCard
            title="Upcoming Bookings"
            value={stats.upcomingBookings.toString()}
            change="No bookings yet"
            changeType="neutral"
            icon={CalendarDays}
          />
          <StatsCard
            title="Total Value"
            value={`$${stats.totalEarnings.toLocaleString()}`}
            change="Estimated monthly value"
            changeType="neutral"
            icon={DollarSign}
          />
          <StatsCard
            title="Occupancy Rate"
            value={`${stats.occupancyRate}%`}
            change={stats.occupancyRate > 0 ? "Active rate" : "No listings"}
            changeType={stats.occupancyRate > 0 ? "positive" : "neutral"}
            icon={TrendingUp}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <OverviewChart />
          <RecentBookings />
        </div>
      </div>
    </div>
  )
}

