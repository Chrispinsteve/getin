"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GetInLogo } from "@/components/getin-logo"
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  CreditCard,
  User,
  MoreHorizontal,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/listings", label: "Listings", icon: Home },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/earnings", label: "Earnings", icon: DollarSign },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/payouts", label: "Payouts", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

const bottomNavLinks = sidebarLinks.slice(0, 4)
const moreLinks = [...sidebarLinks.slice(4), { href: "/dashboard/settings", label: "Settings", icon: Settings }]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = moreLinks.some((link) => pathname === link.href || pathname.startsWith(link.href + "/"))

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <GetInLogo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-border p-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border bg-card px-2 py-2 lg:hidden">
        {bottomNavLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <link.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{link.label}</span>
            </Link>
          )
        })}
        <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors",
                isMoreActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "text-primary")} />
              <span>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="mb-2 w-48">
            {moreLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
              return (
                <DropdownMenuItem key={link.href} asChild>
                  <Link
                    href={link.href}
                    className={cn("flex items-center gap-2", isActive && "text-primary")}
                    onClick={() => setMoreOpen(false)}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </>
  )
}
