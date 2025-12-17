"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestHeaderProps {
  title?: string
  showBack?: boolean
  showNotifications?: boolean
  className?: string
  children?: React.ReactNode
}

export function GuestHeader({ 
  title, 
  showBack = false, 
  showNotifications = false,
  className,
  children 
}: GuestHeaderProps) {
  const router = useRouter()

  return (
    <header className={cn(
      "sticky top-0 z-40 border-b border-border bg-card px-4 py-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
          {children}
        </div>
        
        {showNotifications && (
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              3
            </span>
          </Button>
        )}
      </div>
    </header>
  )
}
