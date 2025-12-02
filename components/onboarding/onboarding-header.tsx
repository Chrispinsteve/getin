"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface OnboardingHeaderProps {
  steps: { id: number; name: string }[]
  currentStep: number
}

export function OnboardingHeader({ steps, currentStep }: OnboardingHeaderProps) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Let&apos;s Set Up Your Property.
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">
        We&apos;ll guide you through a simple 6-step process. It takes 5–7 minutes.
      </p>

      {/* Progress Indicator */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  step.id < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.id === currentStep
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground",
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 hidden text-xs font-medium sm:block",
                  step.id === currentStep ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-8 transition-all duration-300 sm:w-12",
                  step.id < currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
