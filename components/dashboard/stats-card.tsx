import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  iconColor?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
}: StatsCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  changeType === "positive" && "text-accent",
                  changeType === "negative" && "text-destructive",
                  changeType === "neutral" && "text-muted-foreground",
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-2 sm:p-2.5 md:p-3", iconColor)}>
            <Icon className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
