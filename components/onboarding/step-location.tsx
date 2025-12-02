"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin } from "lucide-react"

interface LocationData {
  country: string
  street: string
  city: string
  state: string
  zip: string
  coordinates: { lat: number; lng: number } | null
}

interface StepLocationProps {
  location: LocationData
  onUpdate: (location: LocationData) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

const countries = [
  "Haiti",
  "United States",
  "Canada",
  "Mexico",
  "Dominican Republic",
  "Jamaica",
  "Bahamas",
  "Puerto Rico",
]

export function StepLocation({ location, onUpdate, onNext, onBack, canProceed }: StepLocationProps) {
  const handleChange = (field: keyof LocationData, value: string) => {
    onUpdate({ ...location, [field]: value })
  }

  const handlePositionOnMap = () => {
    // Simulated geocoding - in production, use a real geocoding API
    if (location.city && location.country) {
      onUpdate({
        ...location,
        coordinates: { lat: 18.5944, lng: -72.3074 }, // Default to Port-au-Prince
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Address Form */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Property Address</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={location.country} onValueChange={(value) => handleChange("country", value)}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                placeholder="123 Main Street"
                value={location.street}
                onChange={(e) => handleChange("street", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Port-au-Prince"
                  value={location.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Department</Label>
                <Input
                  id="state"
                  placeholder="Ouest"
                  value={location.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                placeholder="HT6110"
                value={location.zip}
                onChange={(e) => handleChange("zip", e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              onClick={handlePositionOnMap}
              className="w-full bg-transparent"
              disabled={!location.city || !location.country}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Position on Map
            </Button>
          </div>
        </div>

        {/* Map Preview */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
          <div className="flex h-full min-h-[400px] items-center justify-center">
            {location.coordinates ? (
              <div className="relative h-full w-full">
                {/* Simulated map background */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-muted to-primary/10" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg">
                    <MapPin className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="mt-4 rounded-lg bg-card/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                    <p className="text-sm font-medium text-foreground">
                      {location.city}, {location.country}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
                {/* Grid overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                    backgroundSize: "40px 40px",
                  }}
                />
              </div>
            ) : (
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Fill in your address and click &quot;Position on Map&quot;
                </p>
              </div>
            )}
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
