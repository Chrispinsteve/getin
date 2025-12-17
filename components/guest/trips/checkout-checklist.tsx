"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  CheckCircle2, 
  Key, 
  Trash2, 
  DoorClosed, 
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Meh
} from "lucide-react"

interface CheckoutChecklistProps {
  onSubmit: (data: CheckoutData) => void
  loading?: boolean
}

export interface CheckoutData {
  keysReturned: boolean
  trashDisposed: boolean
  windowsClosed: boolean
  lightsOff: boolean
  overallCondition: "excellent" | "good" | "issues"
  issues?: string
}

const checklistItems = [
  { id: "keysReturned", label: "Clés remises", icon: Key },
  { id: "trashDisposed", label: "Poubelles vidées", icon: Trash2 },
  { id: "windowsClosed", label: "Fenêtres fermées", icon: DoorClosed },
  { id: "lightsOff", label: "Lumières éteintes", icon: Lightbulb },
]

export function CheckoutChecklist({ onSubmit, loading }: CheckoutChecklistProps) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    keysReturned: false,
    trashDisposed: false,
    windowsClosed: false,
    lightsOff: false,
  })
  const [condition, setCondition] = useState<"excellent" | "good" | "issues">("good")
  const [issues, setIssues] = useState("")

  const allChecked = Object.values(checklist).every(Boolean)

  const handleSubmit = () => {
    onSubmit({
      ...checklist,
      keysReturned: checklist.keysReturned,
      trashDisposed: checklist.trashDisposed,
      windowsClosed: checklist.windowsClosed,
      lightsOff: checklist.lightsOff,
      overallCondition: condition,
      issues: condition === "issues" ? issues : undefined,
    })
  }

  return (
    <div className="space-y-4">
      {/* Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liste de départ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.map((item) => {
            const Icon = item.icon
            const isChecked = checklist[item.id]
            
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              >
                <Checkbox 
                  checked={isChecked}
                  onCheckedChange={(checked) => 
                    setChecklist(prev => ({ ...prev, [item.id]: !!checked }))
                  }
                />
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                {isChecked && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Condition Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">État général du logement</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={condition}
            onValueChange={(v) => setCondition(v as typeof condition)}
            className="grid grid-cols-3 gap-3"
          >
            <div>
              <RadioGroupItem
                value="excellent"
                id="excellent"
                className="peer sr-only"
              />
              <Label
                htmlFor="excellent"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer"
              >
                <ThumbsUp className="h-6 w-6 text-green-600" />
                <span className="text-xs font-medium">Excellent</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="good"
                id="good"
                className="peer sr-only"
              />
              <Label
                htmlFor="good"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer"
              >
                <Meh className="h-6 w-6 text-blue-600" />
                <span className="text-xs font-medium">Bon</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="issues"
                id="issues"
                className="peer sr-only"
              />
              <Label
                htmlFor="issues"
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50 cursor-pointer"
              >
                <ThumbsDown className="h-6 w-6 text-orange-600" />
                <span className="text-xs font-medium">Problèmes</span>
              </Label>
            </div>
          </RadioGroup>

          {condition === "issues" && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="issues-text">Décrivez les problèmes rencontrés</Label>
              <Textarea
                id="issues-text"
                placeholder="Décrivez les problèmes..."
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        className="w-full" 
        size="lg"
        onClick={handleSubmit}
        disabled={!allChecked || loading}
      >
        {loading ? "Envoi en cours..." : "Confirmer le départ"}
      </Button>

      {!allChecked && (
        <p className="text-xs text-center text-muted-foreground">
          Veuillez cocher tous les éléments de la liste
        </p>
      )}
    </div>
  )
}
