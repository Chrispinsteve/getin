import { DashboardHeader } from "@/components/dashboard/header"
import { AvailabilityCalendar } from "@/components/dashboard/availability-calendar"

export default function CalendarPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Calendar" subtitle="Manage your availability and bookings" />
      <div className="p-6">
        <AvailabilityCalendar />
      </div>
    </div>
  )
}
