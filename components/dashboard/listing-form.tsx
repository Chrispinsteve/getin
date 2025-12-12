"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Upload, X, Loader2 } from "lucide-react"
import { updateListing } from "@/app/dashboard/actions"
import type { ListingInput } from "@/app/become-a-host/actions"
import { toast } from "sonner"

const propertyTypes = [
  { value: "entire-home", label: "Entire Home" },
  { value: "private-room", label: "Private Room" },
  { value: "shared-room", label: "Shared Room" },
  { value: "apartment", label: "Apartment" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "unique", label: "Unique Stay" },
]

const allAmenities = [
  { id: "wifi", label: "WiFi" },
  { id: "ac", label: "Air Conditioning" },
  { id: "hot-water", label: "Hot Water" },
  { id: "workspace", label: "Dedicated Workspace" },
  { id: "heating", label: "Heating" },
  { id: "fire-extinguisher", label: "Fire Extinguisher" },
  { id: "first-aid", label: "First Aid Kit" },
  { id: "smoke-detector", label: "Smoke Detector" },
  { id: "refrigerator", label: "Refrigerator" },
  { id: "stove", label: "Stove" },
  { id: "microwave", label: "Microwave" },
  { id: "coffee-maker", label: "Coffee Maker" },
  { id: "closet", label: "Closet/Wardrobe" },
  { id: "iron", label: "Iron" },
  { id: "hair-dryer", label: "Hair Dryer" },
  { id: "shampoo", label: "Shampoo" },
  { id: "free-parking", label: "Free Parking" },
  { id: "pool", label: "Pool" },
  { id: "hot-tub", label: "Hot Tub" },
  { id: "garden", label: "Garden" },
]

interface ListingFormProps {
  listingId?: string
  initialData?: {
    propertyType: string
    location: {
      country: string
      street: string
      city: string
      state: string
      zip: string
      coordinates: { lat: number; lng: number } | null
    }
    amenities: string[]
    photos: { id: string; url: string; name: string }[]
    pricing: {
      basePrice: number
      cleaningFee: number
      additionalGuestFee: number
      smartPricing: boolean
    }
    availability: {
      blockedDates: string[]
      minStay: number
      maxStay: number
      instantBook: boolean
    }
  }
}

export function ListingForm({ listingId, initialData }: ListingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [propertyType, setPropertyType] = useState(initialData?.propertyType || "")
  const [country, setCountry] = useState(initialData?.location.country || "")
  const [street, setStreet] = useState(initialData?.location.street || "")
  const [city, setCity] = useState(initialData?.location.city || "")
  const [state, setState] = useState(initialData?.location.state || "")
  const [zip, setZip] = useState(initialData?.location.zip || "")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialData?.amenities || [])
  const [photos, setPhotos] = useState<{ id: string; url: string; name: string }[]>(initialData?.photos || [])
  const [basePrice, setBasePrice] = useState(initialData?.pricing.basePrice || 75)
  const [cleaningFee, setCleaningFee] = useState(initialData?.pricing.cleaningFee || 25)
  const [additionalGuestFee, setAdditionalGuestFee] = useState(initialData?.pricing.additionalGuestFee || 10)
  const [smartPricing, setSmartPricing] = useState(initialData?.pricing.smartPricing || false)
  const [minStay, setMinStay] = useState(initialData?.availability.minStay || 1)
  const [maxStay, setMaxStay] = useState(initialData?.availability.maxStay || 30)
  const [instantBook, setInstantBook] = useState(initialData?.availability.instantBook || true)
  const [blockedDates, setBlockedDates] = useState<string[]>(initialData?.availability.blockedDates || [])

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities([...selectedAmenities, amenityId])
    } else {
      setSelectedAmenities(selectedAmenities.filter((id) => id !== amenityId))
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"))
    const newPhotos = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      name: file.name,
    }))
    setPhotos([...photos, ...newPhotos])
  }

  const removePhoto = (id: string) => {
    setPhotos(photos.filter((photo) => photo.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!listingId) {
      toast.error("Listing ID is required")
      return
    }

    if (!propertyType) {
      toast.error("Please select a property type")
      return
    }

    setIsSubmitting(true)

    const listingData: ListingInput = {
      propertyType,
      location: {
        country,
        street,
        city,
        state,
        zip,
        coordinates: initialData?.location.coordinates || null,
      },
      amenities: selectedAmenities,
      photos,
      pricing: {
        basePrice,
        cleaningFee,
        additionalGuestFee,
        smartPricing,
      },
      availability: {
        blockedDates,
        minStay,
        maxStay,
        instantBook,
      },
    }

    const result = await updateListing(listingId, listingData)

    setIsSubmitting(false)

    if (result.success) {
      toast.success("Listing updated successfully")
      router.push("/dashboard/listings")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update listing")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Property Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Department</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {allAmenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.id}
                  checked={selectedAmenities.includes(amenity.id)}
                  onCheckedChange={(checked) => handleAmenityChange(amenity.id, checked as boolean)}
                />
                <Label htmlFor={amenity.id} className="text-sm font-normal cursor-pointer">
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-video rounded-lg border border-border bg-secondary/50 overflow-hidden">
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-primary hover:bg-secondary/50">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Upload Photos</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Base Price per Night ($)</Label>
              <Input
                id="basePrice"
                type="number"
                min="1"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="bg-secondary/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaningFee">Cleaning Fee ($)</Label>
              <Input
                id="cleaningFee"
                type="number"
                min="0"
                value={cleaningFee}
                onChange={(e) => setCleaningFee(Number(e.target.value))}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalGuestFee">Additional Guest Fee ($)</Label>
              <Input
                id="additionalGuestFee"
                type="number"
                min="0"
                value={additionalGuestFee}
                onChange={(e) => setAdditionalGuestFee(Number(e.target.value))}
                className="bg-secondary/50"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
            <div>
              <p className="font-medium">Smart Pricing</p>
              <p className="text-sm text-muted-foreground">AI-powered dynamic pricing</p>
            </div>
            <Switch checked={smartPricing} onCheckedChange={setSmartPricing} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Minimum Stay</Label>
              <span className="text-sm font-medium">{minStay} night{minStay !== 1 ? "s" : ""}</span>
            </div>
            <Slider
              value={[minStay]}
              onValueChange={([value]) => setMinStay(value)}
              min={1}
              max={14}
              step={1}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Maximum Stay</Label>
              <span className="text-sm font-medium">{maxStay} nights</span>
            </div>
            <Slider
              value={[maxStay]}
              onValueChange={([value]) => setMaxStay(value)}
              min={1}
              max={365}
              step={1}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
            <div>
              <p className="font-medium">Instant Book</p>
              <p className="text-sm text-muted-foreground">Guests can book without approval</p>
            </div>
            <Switch checked={instantBook} onCheckedChange={setInstantBook} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/listings")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Listing"
          )}
        </Button>
      </div>
    </form>
  )
}
