import { DashboardHeader } from "@/components/dashboard/header"
import { BookingsTable } from "@/components/dashboard/bookings-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BookingsPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <DashboardHeader title="Bookings" subtitle="Manage your reservations" />
      <div className="p-3 md:p-6">
        <Tabs defaultValue="pending" className="space-y-4 md:space-y-6">
          <TabsList className="bg-secondary/50 w-full justify-start overflow-x-auto">
            <TabsTrigger value="pending" className="text-xs md:text-sm">
              Pending (3)
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs md:text-sm">
              Confirmed (5)
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm">
              Completed (12)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            <BookingsTable status="pending" />
          </TabsContent>
          <TabsContent value="confirmed">
            <BookingsTable status="confirmed" />
          </TabsContent>
          <TabsContent value="completed">
            <BookingsTable status="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
