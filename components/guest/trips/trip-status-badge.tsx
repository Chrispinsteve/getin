"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  PlayCircle,
  CheckCheck 
} from "lucide-react"

type BookingStatus = "pending" | "accepted" | "confirmed" | "active" | "completed" | "cancelled" | "declined"

interface TripStatusBadgeProps {
  status: BookingStatus
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

const statusConfig: Record<BookingStatus, {
  label: string
  color: string
  icon: typeof Clock
}> = {
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  accepted: {
    label: "Accepté",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle2,
  },
  confirmed: {
    label: "Confirmé",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle2,
  },
  active: {
    label: "En cours",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: PlayCircle,
  },
  completed: {
    label: "Terminé",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: CheckCheck,
  },
  cancelled: {
    label: "Annulé",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  declined: {
    label: "Refusé",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
  },
}

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-1",
  lg: "text-sm px-3 py-1.5",
}

export function TripStatusBadge({ 
  status, 
  size = "md",
  showIcon = false 
}: TripStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border",
        config.color,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  )
}
