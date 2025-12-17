"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PriceBreakdownProps {
  pricePerNight: number
  nights: number
  cleaningFee?: number
  serviceFee?: number
  taxes?: number
  discount?: {
    type: "weekly" | "monthly" | "promo"
    amount: number
    label: string
  }
  currency?: string
}

export function PriceBreakdown({
  pricePerNight,
  nights,
  cleaningFee = 0,
  serviceFee,
  taxes = 0,
  discount,
  currency = "HTG",
}: PriceBreakdownProps) {
  const subtotal = pricePerNight * nights
  const calculatedServiceFee = serviceFee ?? Math.round(subtotal * 0.1)
  const discountAmount = discount?.amount ?? 0
  const total = subtotal + cleaningFee + calculatedServiceFee + taxes - discountAmount

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString()} ${currency}`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Détail du prix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Nightly Rate */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatPrice(pricePerNight)} x {nights} nuit{nights > 1 ? "s" : ""}
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Cleaning Fee */}
        {cleaningFee > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frais de ménage</span>
            <span>{formatPrice(cleaningFee)}</span>
          </div>
        )}

        {/* Service Fee */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Frais de service</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Aide à couvrir les frais de fonctionnement de GetIn</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span>{formatPrice(calculatedServiceFee)}</span>
        </div>

        {/* Taxes */}
        {taxes > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Taxes</span>
            <span>{formatPrice(taxes)}</span>
          </div>
        )}

        {/* Discount */}
        {discount && discount.amount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-600">
            <span>{discount.label}</span>
            <span>-{formatPrice(discount.amount)}</span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="text-lg">{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
