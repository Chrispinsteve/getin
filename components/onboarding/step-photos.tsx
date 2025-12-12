"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Upload, X, GripVertical, ImagePlus, Sparkles } from "lucide-react"

interface Photo {
  id: string
  url: string
  name: string
}

interface StepPhotosProps {
  photos: Photo[]
  onUpdate: (photos: Photo[]) => void
  onNext: () => void
  onBack: () => void
  canProceed: boolean
}

export function StepPhotos({ photos, onUpdate, onNext, onBack, canProceed }: StepPhotosProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

      const newPhotos = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file),
        name: file.name,
      }))

      onUpdate([...photos, ...newPhotos])
    },
    [photos, onUpdate],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith("image/"))

    const newPhotos = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      name: file.name,
    }))

    onUpdate([...photos, ...newPhotos])
  }

  const removePhoto = (id: string) => {
    onUpdate(photos.filter((photo) => photo.id !== id))
  }

  const movePhoto = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos]
    const [removed] = newPhotos.splice(fromIndex, 1)
    newPhotos.splice(toIndex, 0, removed)
    onUpdate(newPhotos)
  }

  return (
    <div className="space-y-8">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/50 hover:border-primary/50 hover:bg-muted",
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <Upload className={cn("h-12 w-12", isDragging ? "text-primary" : "text-muted-foreground")} />
        <p className="mt-4 text-center text-lg font-medium text-foreground">Drag and drop your photos here</p>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
        <p className="mt-4 text-xs text-muted-foreground">Minimum 5 photos required ({photos.length}/5)</p>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
            </p>
            <p className="text-xs text-muted-foreground">Drag to reorder. Put your best photo first.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-xl border-2 bg-muted",
                  index === 0 ? "border-primary sm:col-span-2 sm:row-span-2" : "border-border",
                )}
              >
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={photo.name}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                {/* Controls */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-foreground shadow-sm hover:bg-white">
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-destructive shadow-sm hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Cover Badge */}
                {index === 0 && (
                  <div className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                    Cover Photo
                  </div>
                )}
              </div>
            ))}

            {/* Add More Button */}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50 transition-all hover:border-primary/50 hover:bg-muted">
              <input type="file" multiple accept="image/*" onChange={handleFileInput} className="hidden" />
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="mt-2 text-sm text-muted-foreground">Add More</span>
            </label>
          </div>
        </div>
      )}

      {/* AI Enhancement Placeholder */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">AI Photo Enhancement</p>
          <p className="text-sm text-muted-foreground">Automatically enhance your photos for better visibility</p>
        </div>
        <Button variant="outline" disabled>
          Coming Soon
        </Button>
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
