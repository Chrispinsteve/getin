import type React from "react"
import { GuestBottomNavigation } from "@/components/guest/layout/bottom-navigation"

/**
 * GuestLayout - Layout for /guest/* routes
 * 
 * Auth is handled by middleware, so this layout just provides:
 * - Bottom navigation for guest zone
 * - Proper padding for bottom nav
 */
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main>{children}</main>
      <GuestBottomNavigation />
    </div>
  )
}
