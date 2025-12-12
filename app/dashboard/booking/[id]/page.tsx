import { DashboardHeader } from "@/components/dashboard/header"
import { BookingDetails } from "@/components/dashboard/booking-details"

export default function BookingManagementPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Booking Details" subtitle="Manage this reservation" />
      <div className="p-6">
        <BookingDetails />
      </div>
    </div>
  )
}
