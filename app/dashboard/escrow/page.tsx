import { DashboardHeader } from "@/components/dashboard/header"
import { EscrowDisplay } from "@/components/dashboard/escrow-display"

export default function EscrowPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Payment Escrow" subtitle="How your payments are protected" />
      <div className="p-6">
        <EscrowDisplay />
      </div>
    </div>
  )
}
