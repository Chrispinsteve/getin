"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Search, Heart, Briefcase, User } from "lucide-react"

/**
 * GuestBottomNavigation - Mobile navigation for guest zone
 * 
 * Used in: /guest/* routes only
 * All links point to /guest/* paths
 */
const navLinks = [
  { href: "/", label: "Rechercher", icon: Search },
  { href: "/guest/favoris", label: "Favoris", icon: Heart },
  { href: "/guest/voyages", label: "Voyages", icon: Briefcase },
  { href: "/guest/profil", label: "Profil", icon: User },
]

export function GuestBottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card px-2 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navLinks.map((link) => {
          // Home is special - exact match only
          // Others match if pathname starts with the href
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(link.href)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
