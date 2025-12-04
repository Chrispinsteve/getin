import { DashboardHeader } from "@/components/dashboard/header"
import { MessagingInterface } from "@/components/dashboard/messaging-interface"

export default function MessagesPage() {
  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden">
      <DashboardHeader title="Messages" subtitle="Communicate with your guests" />
      <div className="flex-1 min-h-0 p-2 sm:p-4 md:p-6 pb-20 md:pb-6">
        <MessagingInterface />
      </div>
    </div>
  )
}
