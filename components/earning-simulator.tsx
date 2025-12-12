"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calculator, MapPin, Home, BedDouble, ArrowRight, TrendingUp } from "lucide-react"

const BASE_PRICES: Record<string, number> = {
  apartment: 85,
  house: 120,
  villa: 250,
  condo: 95,
}

const ROOM_MULTIPLIERS: Record<string, number> = {
  "1": 1,
  "2": 1.4,
  "3": 1.8,
  "4": 2.2,
}

export function EarningSimulator() {
  const [city, setCity] = useState("")
  const [propertyType, setPropertyType] = useState("")
  const [rooms, setRooms] = useState("")
  const [estimate, setEstimate] = useState<{ low: number; high: number } | null>(null)
  const [showEstimate, setShowEstimate] = useState(false)

  const calculateEstimate = () => {
    if (!propertyType || !rooms) {
      return
    }

    const basePrice = BASE_PRICES[propertyType] || 100
    const multiplier = ROOM_MULTIPLIERS[rooms] || 1
    const nightlyRate = Math.round(basePrice * multiplier)
    const monthlyLow = nightlyRate * 15
    const monthlyHigh = nightlyRate * 25

    setEstimate({ low: monthlyLow, high: monthlyHigh })
    setShowEstimate(true)
  }

  const canEstimate = propertyType && rooms

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-3xl border border-border shadow-xl p-8 sm:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Left Content */}
            <div className="lg:w-1/3 space-y-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Calculator className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground text-balance">
                How much can your place earn?
              </h2>
              <p className="text-muted-foreground">Get an instant estimate based on your location and property type.</p>
            </div>

            {/* Right - Form */}
            <div className="lg:w-2/3">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={propertyType}
                    onChange={(e) => {
                      setPropertyType(e.target.value)
                      setShowEstimate(false)
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Property Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="condo">Condo</option>
                  </select>
                </div>
                <div className="relative">
                  <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    value={rooms}
                    onChange={(e) => {
                      setRooms(e.target.value)
                      setShowEstimate(false)
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Bedrooms</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                </div>
              </div>

              {/* Estimate Result */}
              {showEstimate && estimate && (
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">Estimated Monthly Earnings</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ${estimate.low.toLocaleString()} - ${estimate.high.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on similar properties in your area
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  size="lg"
                  onClick={calculateEstimate}
                  disabled={!canEstimate}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 group disabled:opacity-50"
                >
                  Estimate Earnings
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
