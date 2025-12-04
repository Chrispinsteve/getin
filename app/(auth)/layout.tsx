import type React from "react"
import { GetInLogo } from "@/components/getin-logo"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <GetInLogo />
      </header>
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">{children}</main>
    </div>
  )
}
