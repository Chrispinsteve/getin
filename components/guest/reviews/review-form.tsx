"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Star, Send, ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface ReviewFormProps {
  listing: {
    id: string
    title: string
    hostName: string
  }
  onSubmit: (data: ReviewData) => Promise<void>
  loading?: boolean
}

export interface ReviewData {
  overallRating: number
  cleanlinessRating: number
  accuracyRating: number
  communicationRating: number
  locationRating: number
  checkInRating: number
  valueRating: number
  publicComment: string
  privateMessage?: string
  photos?: File[]
}

const ratingCategories = [
  { key: "cleanlinessRating", label: "Propreté" },
  { key: "accuracyRating", label: "Exactitude" },
  { key: "communicationRating", label: "Communication" },
  { key: "locationRating", label: "Emplacement" },
  { key: "checkInRating", label: "Arrivée" },
  { key: "valueRating", label: "Qualité-prix" },
]

function StarRating({ 
  value, 
  onChange,
  size = "md" 
}: { 
  value: number
  onChange: (value: number) => void
  size?: "sm" | "md" | "lg"
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors",
              (hovered !== null ? star <= hovered : star <= value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewForm({ listing, onSubmit, loading }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0)
  const [ratings, setRatings] = useState<Record<string, number>>({
    cleanlinessRating: 3,
    accuracyRating: 3,
    communicationRating: 3,
    locationRating: 3,
    checkInRating: 3,
    valueRating: 3,
  })
  const [publicComment, setPublicComment] = useState("")
  const [privateMessage, setPrivateMessage] = useState("")
  const [photos, setPhotos] = useState<File[]>([])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setPhotos((prev) => [...prev, ...files].slice(0, 5))
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overallRating === 0) return

    await onSubmit({
      overallRating,
      ...ratings,
      cleanlinessRating: ratings.cleanlinessRating,
      accuracyRating: ratings.accuracyRating,
      communicationRating: ratings.communicationRating,
      locationRating: ratings.locationRating,
      checkInRating: ratings.checkInRating,
      valueRating: ratings.valueRating,
      publicComment,
      privateMessage: privateMessage || undefined,
      photos: photos.length > 0 ? photos : undefined,
    })
  }

  const canSubmit = overallRating > 0 && publicComment.trim().length >= 10

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Overall Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Note globale</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <StarRating value={overallRating} onChange={setOverallRating} size="lg" />
          <p className="text-sm text-muted-foreground">
            {overallRating === 0 && "Sélectionnez une note"}
            {overallRating === 1 && "Très décevant"}
            {overallRating === 2 && "Décevant"}
            {overallRating === 3 && "Correct"}
            {overallRating === 4 && "Très bien"}
            {overallRating === 5 && "Excellent!"}
          </p>
        </CardContent>
      </Card>

      {/* Category Ratings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Évaluez les détails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratingCategories.map((category) => (
            <div key={category.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{category.label}</Label>
                <span className="text-sm font-medium">
                  {ratings[category.key]}/5
                </span>
              </div>
              <Slider
                value={[ratings[category.key]]}
                onValueChange={([value]) =>
                  setRatings((prev) => ({ ...prev, [category.key]: value }))
                }
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Public Comment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Votre avis public</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder={`Partagez votre expérience à ${listing.title}...`}
            value={publicComment}
            onChange={(e) => setPublicComment(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {publicComment.length}/500 caractères (min. 10)
          </p>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Photos (optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square">
                <Image
                  src={URL.createObjectURL(photo)}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handlePhotoUpload}
                />
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Private Message */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Message privé à {listing.hostName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ce message ne sera visible que par l'hôte..."
            value={privateMessage}
            onChange={(e) => setPrivateMessage(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!canSubmit || loading}
      >
        {loading ? (
          "Publication en cours..."
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Publier mon avis
          </>
        )}
      </Button>

      {!canSubmit && overallRating > 0 && publicComment.length < 10 && (
        <p className="text-xs text-center text-muted-foreground">
          Votre commentaire doit contenir au moins 10 caractères
        </p>
      )}
    </form>
  )
}
