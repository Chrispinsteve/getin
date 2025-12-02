"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { DollarSign, Sparkles, Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface PricingData {
  basePrice: number
  cleaningFee: number
  additionalGuestFee: number
  smartPricing: boolean
}

interface AvailabilityData {
  blockedDates: string[]
  minStay: number
  maxStay: number
  instantBook: boolean
}

interface StepPricingProps {
  pricing: PricingData
  availability: AvailabilityData
  onUpdatePricing: (pricing: PricingData) => void
  onUpdateAvailability: (availability: AvailabilityData) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export function StepPricing({
  pricing,
  availability,
  onUpdatePricing,
  onUpdateAvailability,
  onNext,
  onBack,
  canProceed,
}: StepPricingProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Add padding for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -firstDay.getDay() + i + 1))
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const toggleDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    const isBlocked = availability.blockedDates.includes(dateStr)

    onUpdateAvailability({
      ...availability,
      blockedDates: isBlocked
        ? availability.blockedDates.filter((d) => d !== dateStr)
        : [...availability.blockedDates, dateStr],
    })
  }

  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pricing Section */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Pricing</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price per Night (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="basePrice"
                  type="number"
                  min="1"
                  value={pricing.basePrice}
                  onChange={(e) => onUpdatePricing({ ...pricing, basePrice: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaningFee">Cleaning Fee (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cleaningFee"
                  type="number"
                  min="0"
                  value={pricing.cleaningFee}
                  onChange={(e) => onUpdatePricing({ ...pricing, cleaningFee: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalGuestFee">Additional Guest Fee (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="additionalGuestFee"
                  type="number"
                  min="0"
                  value={pricing.additionalGuestFee}
                  onChange={(e) => onUpdatePricing({ ...pricing, additionalGuestFee: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Smart Pricing Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Smart Pricing</p>
                  <p className="text-sm text-muted-foreground">AI-powered dynamic pricing</p>
                </div>
              </div>
              <Switch
                checked={pricing.smartPricing}
                onCheckedChange={(checked) => onUpdatePricing({ ...pricing, smartPricing: checked })}
              />
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Availability</h3>
          </div>

          {/* Mini Calendar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-medium">{monthName}</span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="rounded-lg p-2 hover:bg-muted"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {days.map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const dateStr = date.toISOString().split("T")[0]
                const isBlocked = availability.blockedDates.includes(dateStr)
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

                return (
                  <button
                    key={index}
                    disabled={!isCurrentMonth || isPast}
                    onClick={() => toggleDate(date)}
                    className={cn(
                      "aspect-square rounded-lg p-2 text-sm transition-colors",
                      !isCurrentMonth && "text-muted-foreground/30",
                      isPast && "text-muted-foreground/30 cursor-not-allowed",
                      isCurrentMonth && !isPast && "hover:bg-muted",
                      isBlocked && "bg-destructive/10 text-destructive line-through",
                    )}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">Click dates to block/unblock</p>
          </div>

          {/* Stay Requirements */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Minimum Stay</Label>
                <span className="text-sm font-medium">
                  {availability.minStay} night{availability.minStay !== 1 ? "s" : ""}
                </span>
              </div>
              <Slider
                value={[availability.minStay]}
                onValueChange={([value]) => onUpdateAvailability({ ...availability, minStay: value })}
                min={1}
                max={14}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Maximum Stay</Label>
                <span className="text-sm font-medium">{availability.maxStay} nights</span>
              </div>
              <Slider
                value={[availability.maxStay]}
                onValueChange={([value]) => onUpdateAvailability({ ...availability, maxStay: value })}
                min={1}
                max={365}
                step={1}
              />
            </div>

            {/* Instant Book Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
              <div>
                <p className="font-medium text-foreground">Instant Book</p>
                <p className="text-sm text-muted-foreground">Guests can book without approval</p>
              </div>
              <Switch
                checked={availability.instantBook}
                onCheckedChange={(checked) => onUpdateAvailability({ ...availability, instantBook: checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed} size="lg" className="min-w-[140px]">
          Next
        </Button>
      </div>
    </div>
  )
}
