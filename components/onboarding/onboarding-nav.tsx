"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function OnboardingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">G</span>
          </div>
          <span className="text-xl font-bold text-foreground">GetIn</span>
        </Link>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
          <Link href="/">Save & Exit</Link>
        </Button>
      </div>
    </nav>
  )
}
