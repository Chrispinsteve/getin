"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingNav } from "@/components/onboarding/onboarding-nav"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"
import { StepPropertyType } from "@/components/onboarding/step-property-type"
import { StepLocation } from "@/components/onboarding/step-location"
import { StepAmenities } from "@/components/onboarding/step-amenities"
import { StepPhotos } from "@/components/onboarding/step-photos"
import { StepPricing } from "@/components/onboarding/step-pricing"
import { StepReview } from "@/components/onboarding/step-review"
import { createListing } from "./actions"

export interface ListingData {
  propertyType: string | null
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

const initialData: ListingData = {
  propertyType: null,
  location: {
    country: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    coordinates: null,
  },
  amenities: [],
  photos: [],
  pricing: {
    basePrice: 75,
    cleaningFee: 25,
    additionalGuestFee: 10,
    smartPricing: false,
  },
  availability: {
    blockedDates: [],
    minStay: 1,
    maxStay: 30,
    instantBook: true,
  },
}

const steps = [
  { id: 1, name: "Property Type" },
  { id: 2, name: "Location" },
  { id: 3, name: "Amenities" },
  { id: 4, name: "Photos" },
  { id: 5, name: "Pricing" },
  { id: 6, name: "Review" },
]

export default function BecomeAHostPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [listingData, setListingData] = useState<ListingData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  const updateListingData = (updates: Partial<ListingData>) => {
    setListingData((prev) => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep((prev) => prev + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1)
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return listingData.propertyType !== null
      case 2:
        return (
          listingData.location.country !== "" && listingData.location.city !== "" && listingData.location.street !== ""
        )
      case 3:
        return listingData.amenities.length > 0
      case 4:
        return listingData.photos.length >= 5
      case 5:
        return listingData.pricing.basePrice > 0
      case 6:
        return true
      default:
        return false
    }
  }

  const handlePublish = async () => {
    if (!listingData.propertyType) return

    setIsSubmitting(true)
    setSubmitError(null)

    const result = await createListing(
      {
        ...listingData,
        propertyType: listingData.propertyType,
      },
      "published",
    )

    setIsSubmitting(false)

    if (result.success) {
      router.push("/become-a-host/success")
    } else {
      setSubmitError(result.error || "Failed to publish listing")
    }
  }

  const handleSaveDraft = async () => {
    if (!listingData.propertyType) return

    setIsSubmitting(true)
    setSubmitError(null)

    const result = await createListing(
      {
        ...listingData,
        propertyType: listingData.propertyType,
      },
      "draft",
    )

    setIsSubmitting(false)

    if (result.success) {
      router.push("/become-a-host/success?draft=true")
    } else {
      setSubmitError(result.error || "Failed to save draft")
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepPropertyType
            selected={listingData.propertyType}
            onSelect={(type) => updateListingData({ propertyType: type })}
            onNext={nextStep}
            canProceed={canProceed()}
          />
        )
      case 2:
        return (
          <StepLocation
            location={listingData.location}
            onUpdate={(location) => updateListingData({ location })}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )
      case 3:
        return (
          <StepAmenities
            selected={listingData.amenities}
            onUpdate={(amenities) => updateListingData({ amenities })}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )
      case 4:
        return (
          <StepPhotos
            photos={listingData.photos}
            onUpdate={(photos) => updateListingData({ photos })}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )
      case 5:
        return (
          <StepPricing
            pricing={listingData.pricing}
            availability={listingData.availability}
            onUpdatePricing={(pricing) => updateListingData({ pricing })}
            onUpdateAvailability={(availability) => updateListingData({ availability })}
            onNext={nextStep}
            onBack={prevStep}
            canProceed={canProceed()}
          />
        )
      case 6:
        return (
          <StepReview
            data={listingData}
            onEdit={goToStep}
            onBack={prevStep}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            isSubmitting={isSubmitting}
            error={submitError}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingNav />
      <main className="mx-auto max-w-4xl px-4 py-8 pb-24">
        <OnboardingHeader steps={steps} currentStep={currentStep} />
        <div className="mt-8">{renderStep()}</div>
      </main>
    </div>
  )
}
