import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GuestBottomNavigation } from "@/components/guest/layout/bottom-navigation"

export default async function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user roles for role-based access control
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single()

  const isGuest = profile?.roles?.includes("guest")
  const isHost = profile?.roles?.includes("host")

  // Redirect host-only users to dashboard
  if (!isGuest && isHost) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main>{children}</main>
      <GuestBottomNavigation />
    </div>
  )
}
