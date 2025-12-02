"use client"

import { useEffect, useState } from "react"
import { Home, DollarSign, Calendar, TrendingUp, Star, Bell } from "lucide-react"

export function AnimatedCardStack() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative h-[400px] sm:h-[500px] w-full">
      {/* Main Property Card */}
      <div
        className={`absolute top-0 left-0 sm:left-8 w-full max-w-[320px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-700 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Home className="w-16 h-16 text-primary/60" />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-card-foreground">Modern Downtown Loft</h3>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-medium text-card-foreground">4.9</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Port-au-Prince, Haiti</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">$127</span>
            <span className="text-muted-foreground text-sm">/night</span>
          </div>
        </div>
      </div>

      {/* Earnings Dashboard Card */}
      <div
        className={`absolute top-24 right-0 sm:right-4 w-[280px] bg-card rounded-2xl shadow-xl border border-border p-5 transition-all duration-700 delay-200 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-2xl font-bold text-card-foreground">$3,240</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-accent font-medium">+23%</span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
        {/* Mini chart visualization */}
        <div className="mt-4 flex items-end gap-1 h-12">
          {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
            <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>

      {/* Booking Request Card */}
      <div
        className={`absolute bottom-8 left-4 sm:left-12 w-[260px] bg-card rounded-2xl shadow-xl border border-border p-4 transition-all duration-700 delay-400 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-card-foreground text-sm">New Booking Request</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sarah M. • Dec 15-18</p>
            <div className="flex gap-2 mt-3">
              <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full hover:bg-primary/90 transition-colors">
                Accept
              </button>
              <button className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-full hover:bg-muted/80 transition-colors">
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification badge */}
      <div
        className={`absolute top-4 right-12 sm:right-20 w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center transition-all duration-700 delay-600 ${
          mounted ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        <Bell className="w-5 h-5 text-primary-foreground" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
          3
        </span>
      </div>
    </div>
  )
}
