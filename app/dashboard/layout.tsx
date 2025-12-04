import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="pb-16 lg:ml-64 lg:pb-0">{children}</main>
    </div>
  )
}
