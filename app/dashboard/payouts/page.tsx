import { DashboardHeader } from "@/components/dashboard/header"
import { PayoutSettings } from "@/components/dashboard/payout-settings"

export default function PayoutsPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Payout Settings" subtitle="Manage how you receive your earnings" />
      <div className="p-6">
        <PayoutSettings />
      </div>
    </div>
  )
}
