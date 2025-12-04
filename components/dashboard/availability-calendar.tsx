"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

const listings = [
  { id: "1", name: "Modern Downtown Loft" },
  { id: "2", name: "Beachfront Villa" },
  { id: "3", name: "Mountain Cabin Retreat" },
  { id: "4", name: "Cozy Studio Apartment" },
]

// Mock data for calendar
const bookedDates = [15, 16, 17, 22, 23, 24, 25]
const blockedDates = [10, 11, 28, 29]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function AvailabilityCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1)) // December 2024
  const [selectedDates, setSelectedDates] = useState<number[]>([])
  const [selectedListing, setSelectedListing] = useState("1")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const toggleDate = (day: number) => {
    if (bookedDates.includes(day)) return // Can't select booked dates

    if (selectedDates.includes(day)) {
      setSelectedDates(selectedDates.filter((d) => d !== day))
    } else {
      setSelectedDates([...selectedDates, day])
    }
  }

  const getDayStatus = (day: number) => {
    if (bookedDates.includes(day)) return "booked"
    if (blockedDates.includes(day)) return "blocked"
    if (selectedDates.includes(day)) return "selected"
    return "available"
  }

  const handleBlockSelected = () => {
    // UI only - would block selected dates
    setSelectedDates([])
  }

  const handleUnblockSelected = () => {
    // UI only - would unblock selected dates
    setSelectedDates([])
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Select value={selectedListing} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-full lg:w-[280px] bg-secondary/50 text-sm md:text-base">
            <SelectValue placeholder="Select a listing" />
          </SelectTrigger>
          <SelectContent>
            {listings.map((listing) => (
              <SelectItem key={listing.id} value={listing.id}>
                {listing.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleBlockSelected}
            disabled={selectedDates.length === 0}
            className="gap-1.5 md:gap-2 bg-transparent text-xs md:text-sm flex-1 lg:flex-none"
            size="sm"
          >
            <Lock className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Block Selected</span>
            <span className="sm:hidden">Block</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleUnblockSelected}
            disabled={selectedDates.length === 0}
            className="gap-1.5 md:gap-2 bg-transparent text-xs md:text-sm flex-1 lg:flex-none"
            size="sm"
          >
            <Unlock className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Unblock Selected</span>
            <span className="sm:hidden">Unblock</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 md:p-4 md:pb-4 lg:p-6 lg:pb-4">
            <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">
              {MONTHS[month]} {year}
            </CardTitle>
            <div className="flex gap-1 md:gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9">
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9">
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 md:p-4 lg:p-6 pt-0">
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="p-1 md:p-2 text-center text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground"
                >
                  <span className="hidden md:inline">{day}</span>
                  <span className="md:hidden">{day.charAt(0)}</span>
                </div>
              ))}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1 md:p-2" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const status = getDayStatus(day)
                return (
                  <button
                    key={day}
                    onClick={() => toggleDate(day)}
                    disabled={status === "booked"}
                    className={cn(
                      "aspect-square rounded md:rounded-lg p-0.5 md:p-1 lg:p-2 text-[10px] md:text-xs lg:text-sm font-medium transition-colors",
                      status === "available" && "hover:bg-secondary",
                      status === "selected" && "bg-primary text-primary-foreground",
                      status === "booked" && "bg-primary/20 text-primary cursor-not-allowed",
                      status === "blocked" && "bg-muted text-muted-foreground line-through",
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="p-3 md:p-4 lg:p-6">
            <CardTitle className="text-sm md:text-base lg:text-lg font-semibold">Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3 lg:space-y-4 p-3 pt-0 md:p-4 md:pt-0 lg:p-6 lg:pt-0">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 rounded md:rounded-lg bg-card border border-border shrink-0" />
              <div>
                <p className="font-medium text-xs md:text-sm lg:text-base">Available</p>
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">Open for bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 rounded md:rounded-lg bg-primary/20 shrink-0" />
              <div>
                <p className="font-medium text-xs md:text-sm lg:text-base">Booked</p>
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">Has a reservation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 rounded md:rounded-lg bg-muted shrink-0" />
              <div>
                <p className="font-medium text-xs md:text-sm lg:text-base">Blocked</p>
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">Not available</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 rounded md:rounded-lg bg-primary shrink-0" />
              <div>
                <p className="font-medium text-xs md:text-sm lg:text-base">Selected</p>
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">Click to modify</p>
              </div>
            </div>
          </CardContent>

          <CardContent className="border-t border-border p-3 pt-3 md:p-4 md:pt-4 lg:p-6 lg:pt-4">
            <h4 className="mb-2 md:mb-3 font-semibold text-xs md:text-sm lg:text-base">Upcoming Bookings</h4>
            <div className="space-y-2 md:space-y-3">
              <div className="rounded md:rounded-lg bg-secondary/50 p-2 md:p-3">
                <p className="font-medium text-xs md:text-sm lg:text-base">Sarah M.</p>
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">Dec 15-17, 2024</p>
              </div>
              <div className="rounded md:rounded-lg bg-secondary/50 p-2 md:p-3">
                <p className="font-medium text-xs md:text-sm lg:text-base">Michael K.</p>
                <p className="text-[10px] md:text-xs lg:text-sm text-muted-foreground">Dec 22-25, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
