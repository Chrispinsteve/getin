"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CreditCard, Smartphone, Wallet } from "lucide-react"

export type PaymentMethod = "moncash" | "card" | "paypal"

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
  savedCards?: Array<{
    id: string
    last4: string
    brand: string
    expMonth: number
    expYear: number
  }>
}

const paymentMethods = [
  {
    id: "moncash" as const,
    name: "MonCash",
    description: "Paiement mobile Digicel",
    icon: Smartphone,
    popular: true,
  },
  {
    id: "card" as const,
    name: "Carte bancaire",
    description: "Visa, Mastercard",
    icon: CreditCard,
    popular: false,
  },
  {
    id: "paypal" as const,
    name: "PayPal",
    description: "Paiement sécurisé",
    icon: Wallet,
    popular: false,
  },
]

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  savedCards,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <RadioGroup
        value={selectedMethod}
        onValueChange={(v) => onMethodChange(v as PaymentMethod)}
      >
        {paymentMethods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedMethod === method.id

          return (
            <div key={method.id}>
              <RadioGroupItem
                value={method.id}
                id={method.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={method.id}
                className={cn(
                  "flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isSelected ? "bg-primary/10" : "bg-secondary"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{method.name}</span>
                    {method.popular && (
                      <Badge variant="secondary" className="text-[10px]">
                        Populaire
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      {/* Saved Cards (if card is selected) */}
      {selectedMethod === "card" && savedCards && savedCards.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Cartes enregistrées</p>
            <div className="space-y-2">
              {savedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {card.brand} •••• {card.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expire {card.expMonth}/{card.expYear}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
