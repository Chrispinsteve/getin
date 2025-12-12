"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  MapPin,
  Wifi,
  Camera,
  DollarSign,
  Calendar,
  Pencil,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react"
import type { ListingData } from "@/app/become-a-host/page"

interface StepReviewProps {
  data: ListingData
  onEdit: (step: number) => void
  onBack: () => void
  onPublish: () => void
  onSaveDraft: () => void
  isSubmitting?: boolean
  error?: string | null
}

const propertyTypeLabels: Record<string, string> = {
  "entire-home": "Entire Home",
  "private-room": "Private Room",
  "shared-room": "Shared Room",
  apartment: "Apartment",
  guesthouse: "Guesthouse",
  villa: "Villa",
  studio: "Studio",
  unique: "Unique Stay",
}

export function StepReview({ data, onEdit, onBack, onPublish, onSaveDraft, isSubmitting, error }: StepReviewProps) {
  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Review Your Listing</h3>
            <p className="text-sm text-muted-foreground">Make sure everything looks good before publishing</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Property Type */}
          <div className="flex items-start justify-between rounded-xl border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Property Type</p>
                <p className="text-sm text-muted-foreground">
                  {data.propertyType ? propertyTypeLabels[data.propertyType] : "Not selected"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>

          {/* Location */}
          <div className="flex items-start justify-between rounded-xl border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Location</p>
                <p className="text-sm text-muted-foreground">
                  {data.location.street ? (
                    <>
                      {data.location.street}, {data.location.city}, {data.location.state} {data.location.zip},{" "}
                      {data.location.country}
                    </>
                  ) : (
                    "Not specified"
                  )}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>

          {/* Amenities */}
          <div className="flex items-start justify-between rounded-xl border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Wifi className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Amenities</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.amenities.length > 0 ? (
                    data.amenities.slice(0, 6).map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {amenity.replace(/-/g, " ")}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None selected</p>
                  )}
                  {data.amenities.length > 6 && <Badge variant="outline">+{data.amenities.length - 6} more</Badge>}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>

          {/* Photos */}
          <div className="flex items-start justify-between rounded-xl border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Photos</p>
                <p className="text-sm text-muted-foreground">{data.photos.length} photos uploaded</p>
                {data.photos.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {data.photos.slice(0, 4).map((photo) => (
                      <div key={photo.id} className="h-12 w-12 overflow-hidden rounded-lg">
                        <img
                          src={photo.url || "/placeholder.svg"}
                          alt={photo.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {data.photos.length > 4 && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                        +{data.photos.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(4)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>

          {/* Pricing */}
          <div className="flex items-start justify-between rounded-xl border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Pricing</p>
                <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <p>Base price: ${data.pricing.basePrice}/night</p>
                  <p>Cleaning fee: ${data.pricing.cleaningFee}</p>
                  {data.pricing.additionalGuestFee > 0 && <p>Additional guest: ${data.pricing.additionalGuestFee}</p>}
                  {data.pricing.smartPricing && (
                    <Badge variant="secondary" className="mt-1">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Smart Pricing Enabled
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(5)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>

          {/* Availability */}
          <div className="flex items-start justify-between rounded-xl border border-border p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Availability</p>
                <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Stay: {data.availability.minStay}–{data.availability.maxStay} nights
                  </p>
                  <p>{data.availability.instantBook ? "Instant Book enabled" : "Request to book"}</p>
                  {data.availability.blockedDates.length > 0 && (
                    <p>{data.availability.blockedDates.length} dates blocked</p>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEdit(5)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack} size="lg" disabled={isSubmitting}>
          Back
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={onSaveDraft} size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Draft"
            )}
          </Button>
          <Button onClick={onPublish} size="lg" className="min-w-[180px]" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Publish Listing
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
