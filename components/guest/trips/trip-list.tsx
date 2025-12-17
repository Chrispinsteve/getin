"use client"

import { useState } from "react"
import { TripCard, type TripCardProps } from "./trip-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Briefcase } from "lucide-react"

interface TripListProps {
  trips: TripCardProps[]
  loading?: boolean
}

export function TripList({ trips, loading }: TripListProps) {
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming")

  const now = new Date()
  
  const filteredTrips = trips.filter((trip) => {
    const checkOut = new Date(trip.checkOut)
    if (filter === "upcoming") {
      return checkOut >= now && trip.status !== "cancelled"
    }
    if (filter === "past") {
      return checkOut < now || trip.status === "completed"
    }
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">À venir</TabsTrigger>
          <TabsTrigger value="past" className="flex-1">Passés</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">Tous</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-secondary p-4 mb-4">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Aucun voyage</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            {filter === "upcoming" 
              ? "Vous n'avez pas de voyage à venir. Commencez à explorer!"
              : filter === "past"
              ? "Vous n'avez pas encore effectué de voyage."
              : "Aucun voyage trouvé."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} {...trip} />
          ))}
        </div>
      )}
    </div>
  )
}
