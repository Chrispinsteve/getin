import { DashboardHeader } from "@/components/dashboard/header"
import { EarningsOverview } from "@/components/dashboard/earnings-overview"

export default function EarningsPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Earnings" subtitle="Track your revenue and payouts" />
      <div className="p-6">
        <EarningsOverview />
      </div>
    </div>
  )
}
