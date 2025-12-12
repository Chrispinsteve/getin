"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wifi,
  Wind,
  Droplets,
  Laptop,
  Flame,
  ShieldCheck,
  Refrigerator,
  CookingPot,
  Bed,
  Shirt,
  Bath,
  Car,
  Waves,
  Mountain,
  Sunset,
  ChevronDown,
  X,
} from "lucide-react"

const amenityCategories = [
  {
    id: "essentials",
    name: "Essentials",
    items: [
      { id: "wifi", label: "Wi-Fi", icon: Wifi },
      { id: "ac", label: "Air Conditioning", icon: Wind },
      { id: "hot-water", label: "Hot Water", icon: Droplets },
      { id: "workspace", label: "Dedicated Workspace", icon: Laptop },
      { id: "heating", label: "Heating", icon: Flame },
    ],
  },
  {
    id: "safety",
    name: "Safety",
    items: [
      { id: "fire-extinguisher", label: "Fire Extinguisher", icon: ShieldCheck },
      { id: "first-aid", label: "First Aid Kit", icon: ShieldCheck },
      { id: "smoke-detector", label: "Smoke Detector", icon: ShieldCheck },
      { id: "co-detector", label: "CO Detector", icon: ShieldCheck },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    items: [
      { id: "refrigerator", label: "Refrigerator", icon: Refrigerator },
      { id: "stove", label: "Stove", icon: CookingPot },
      { id: "microwave", label: "Microwave", icon: CookingPot },
      { id: "coffee-maker", label: "Coffee Maker", icon: CookingPot },
      { id: "dishwasher", label: "Dishwasher", icon: CookingPot },
    ],
  },
  {
    id: "bedroom",
    name: "Bedroom",
    items: [
      { id: "closet", label: "Closet/Wardrobe", icon: Bed },
      { id: "iron", label: "Iron", icon: Shirt },
      { id: "hangers", label: "Hangers", icon: Shirt },
      { id: "extra-pillows", label: "Extra Pillows", icon: Bed },
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    items: [
      { id: "hair-dryer", label: "Hair Dryer", icon: Bath },
      { id: "shampoo", label: "Shampoo", icon: Bath },
      { id: "body-soap", label: "Body Soap", icon: Bath },
      { id: "towels", label: "Towels", icon: Bath },
    ],
  },
  {
    id: "parking",
    name: "Parking",
    items: [
      { id: "free-parking", label: "Free Parking", icon: Car },
      { id: "garage", label: "Garage", icon: Car },
      { id: "street-parking", label: "Street Parking", icon: Car },
    ],
  },
  {
    id: "special",
    name: "Special Features",
    items: [
      { id: "pool", label: "Pool", icon: Waves },
      { id: "hot-tub", label: "Hot Tub", icon: Waves },
      { id: "garden", label: "Garden", icon: Mountain },
      { id: "rooftop", label: "Rooftop", icon: Sunset },
      { id: "ocean-view", label: "Ocean View", icon: Waves },
      { id: "mountain-view", label: "Mountain View", icon: Mountain },
    ],
  },
]

interface StepAmenitiesProps {
  selected: string[]
  onUpdate: (amenities: string[]) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export function StepAmenities({ selected, onUpdate, onNext, onBack, canProceed }: StepAmenitiesProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["essentials", "special"])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleAmenity = (amenityId: string) => {
    onUpdate(selected.includes(amenityId) ? selected.filter((id) => id !== amenityId) : [...selected, amenityId])
  }

  const removeAmenity = (amenityId: string) => {
    onUpdate(selected.filter((id) => id !== amenityId))
  }

  const getAmenityLabel = (amenityId: string): string => {
    for (const category of amenityCategories) {
      const item = category.items.find((i) => i.id === amenityId)
      if (item) return item.label
    }
    return amenityId
  }

  return (
    <div className="space-y-8">
      {/* Selected Amenities Chips */}
      {selected.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Selected Amenities ({selected.length})</p>
          <div className="flex flex-wrap gap-2">
            {selected.map((amenityId) => (
              <Badge key={amenityId} variant="secondary" className="gap-1 py-1.5 pl-3 pr-2">
                {getAmenityLabel(amenityId)}
                <button
                  onClick={() => removeAmenity(amenityId)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {amenityCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id)
          return (
            <div key={category.id} className="rounded-2xl border border-border bg-card shadow-sm">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="font-semibold text-foreground">{category.name}</span>
                <ChevronDown
                  className={cn("h-5 w-5 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                />
              </button>
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-2">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {category.items.map((item) => {
                      const Icon = item.icon
                      const isSelected = selected.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleAmenity(item.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200",
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                          )}
                        >
                          <Icon
                            className={cn("h-5 w-5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")}
                          />
                          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                            {item.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
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
