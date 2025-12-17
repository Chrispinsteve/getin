"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Wifi, 
  Key, 
  MapPin, 
  Clock, 
  Phone, 
  AlertTriangle,
  Copy,
  Check
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface InstructionsCardProps {
  instructions: {
    address: string
    checkInTime: string
    checkOutTime: string
    wifiName?: string
    wifiPassword?: string
    doorCode?: string
    specialInstructions?: string
    emergencyContact?: string
    houseRules?: string[]
  }
}

export function InstructionsCard({ instructions }: InstructionsCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Check-in/out Times */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horaires
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Arrivée</p>
            <p className="font-semibold">{instructions.checkInTime}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Départ</p>
            <p className="font-semibold">{instructions.checkOutTime}</p>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-3">{instructions.address}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(instructions.address, "address")}
            >
              {copiedField === "address" ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              Copier
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(instructions.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir Maps
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Door Code */}
      {instructions.doorCode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              Code d'accès
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <code className="text-2xl font-mono font-bold tracking-widest">
                {instructions.doorCode}
              </code>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(instructions.doorCode!, "doorCode")}
              >
                {copiedField === "doorCode" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WiFi */}
      {instructions.wifiName && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              WiFi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Réseau</p>
                <p className="font-medium">{instructions.wifiName}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(instructions.wifiName!, "wifiName")}
              >
                {copiedField === "wifiName" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {instructions.wifiPassword && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Mot de passe</p>
                  <code className="font-mono">{instructions.wifiPassword}</code>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyToClipboard(instructions.wifiPassword!, "wifiPassword")}
                >
                  {copiedField === "wifiPassword" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Special Instructions */}
      {instructions.specialInstructions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Instructions spéciales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{instructions.specialInstructions}</p>
          </CardContent>
        </Card>
      )}

      {/* House Rules */}
      {instructions.houseRules && instructions.houseRules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Règles de la maison</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {instructions.houseRules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      {instructions.emergencyContact && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              Contact d'urgence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="font-medium text-orange-800">{instructions.emergencyContact}</p>
              <a href={`tel:${instructions.emergencyContact}`}>
                <Button size="sm" variant="outline" className="border-orange-300">
                  <Phone className="h-3 w-3 mr-1" />
                  Appeler
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
