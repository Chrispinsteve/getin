"use client"

import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border bg-card px-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-6 md:py-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight md:text-2xl">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground md:text-sm">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-64 bg-secondary/50 pl-9" />
        </div>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground md:h-5 md:w-5 md:text-xs">
            3
          </span>
        </Button>
        <Avatar className="h-8 w-8 md:h-9 md:w-9">
          <AvatarImage src="/host-profile.jpg" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
