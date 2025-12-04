import { DashboardHeader } from "@/components/dashboard/header"
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Analytics" subtitle="Performance metrics and insights" />
      <div className="p-6">
        <AnalyticsDashboard />
      </div>
    </div>
  )
}
