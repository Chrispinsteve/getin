import { DashboardHeader } from "@/components/dashboard/header"
import { HostProfile } from "@/components/dashboard/host-profile"

export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Host Profile" subtitle="Manage your public hosting profile" />
      <div className="p-6">
        <HostProfile />
      </div>
    </div>
  )
}
