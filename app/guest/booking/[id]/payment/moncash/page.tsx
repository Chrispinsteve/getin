"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GuestHeader } from "@/components/guest/layout/guest-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function MoncashPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phone, setPhone] = useState("")
  const [step, setStep] = useState<"phone" | "confirm" | "processing">("phone")
  
  const bookingId = searchParams.get("booking")
  const amount = searchParams.get("amount")

  const handleSendRequest = () => {
    if (phone.length < 8) {
      toast.error("Numéro de téléphone invalide")
      return
    }
    setStep("confirm")
    
    // Simulate MonCash request
    toast.info("Vérifiez votre téléphone MonCash")
  }

  const handleConfirmPayment = async () => {
    setStep("processing")
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In real implementation, this would verify with MonCash API
    router.push(`/booking/new/payment/success?booking=${bookingId}`)
  }

  return (
    <div className="min-h-screen">
      <GuestHeader title="Paiement MonCash" showBack />
      
      <div className="p-4 space-y-4">
        {/* Amount Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <p className="text-sm opacity-90">Montant à payer</p>
            <p className="text-3xl font-bold mt-1">
              {parseInt(amount || "0").toLocaleString()} HTG
            </p>
          </CardContent>
        </Card>

        {step === "phone" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Numéro MonCash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+509 XXXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Entrez le numéro associé à votre compte MonCash
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSendRequest}
                disabled={phone.length < 8}
              >
                Envoyer la demande de paiement
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "confirm" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Confirmer le paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <Smartphone className="h-12 w-12 mx-auto text-primary mb-3" />
                <p className="font-medium">Demande envoyée!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ouvrez l'application MonCash sur votre téléphone et approuvez le paiement
                </p>
              </div>

              <div className="text-sm space-y-2">
                <p><strong>1.</strong> Ouvrez MonCash</p>
                <p><strong>2.</strong> Vérifiez le montant: {parseInt(amount || "0").toLocaleString()} HTG</p>
                <p><strong>3.</strong> Entrez votre code PIN</p>
                <p><strong>4.</strong> Confirmez le paiement</p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleConfirmPayment}
              >
                J'ai confirmé sur MonCash
              </Button>

              <Button 
                variant="outline"
                className="w-full"
                onClick={() => setStep("phone")}
              >
                Changer de numéro
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "processing" && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-16 w-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
              </div>
              <p className="font-medium mt-4">Vérification du paiement...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Veuillez patienter quelques instants
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help */}
        <p className="text-xs text-center text-muted-foreground">
          Besoin d'aide? Contactez le support MonCash au *202#
        </p>
      </div>
    </div>
  )
}
