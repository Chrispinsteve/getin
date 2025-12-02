"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, DoorOpen, Users, Building, Warehouse, Castle, LayoutGrid, Sparkles } from "lucide-react"

const propertyTypes = [
  { id: "entire-home", label: "Entire Home", icon: Home, description: "Guests have the whole place to themselves" },
  { id: "private-room", label: "Private Room", icon: DoorOpen, description: "A private room within a larger property" },
  { id: "shared-room", label: "Shared Room", icon: Users, description: "A shared space with other guests" },
  { id: "apartment", label: "Apartment", icon: Building, description: "A self-contained unit in a building" },
  { id: "guesthouse", label: "Guesthouse", icon: Warehouse, description: "A separate structure on the property" },
  { id: "villa", label: "Villa", icon: Castle, description: "A luxurious standalone residence" },
  { id: "studio", label: "Studio", icon: LayoutGrid, description: "A compact single-room living space" },
  { id: "unique", label: "Unique Stays", icon: Sparkles, description: "Treehouse, cabin, yurt, or something special" },
]

interface StepPropertyTypeProps {
  selected: string | null
  onSelect: (type: string) => void
  onNext: () => void
  canProceed: boolean
}

export function StepPropertyType({ selected, onSelect, onNext, canProceed }: StepPropertyTypeProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {propertyTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selected === type.id
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.id)}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-2xl border-2 bg-card p-6 text-center transition-all duration-200 hover:border-primary/50 hover:shadow-lg",
                isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border",
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <p className={cn("font-semibold", isSelected ? "text-primary" : "text-foreground")}>{type.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
              </div>
              {isSelected && (
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} size="lg" className="min-w-[140px]">
          Next
        </Button>
      </div>
    </div>
  )
}
