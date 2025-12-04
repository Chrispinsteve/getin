"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Smartphone, Mail, CreditCard, Building, Check, Plus } from "lucide-react"

const savedMethods = [
  {
    id: "moncash",
    type: "moncash",
    label: "MonCash",
    value: "+509 3XXX-XXXX",
    isPrimary: true,
  },
  {
    id: "paypal",
    type: "paypal",
    label: "PayPal",
    value: "john.doe@email.com",
    isPrimary: false,
  },
]

export function PayoutSettings() {
  const [selectedMethod, setSelectedMethod] = useState("moncash")
  const [showAddForm, setShowAddForm] = useState(false)
  const [addMethodType, setAddMethodType] = useState<string | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    // UI placeholder only
    setShowAddForm(false)
    setAddMethodType(null)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Saved Payout Methods</CardTitle>
          <CardDescription>Select your preferred method for receiving payouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
            {savedMethods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  selectedMethod === method.id ? "border-primary bg-primary/5" : "border-border/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="rounded-lg bg-secondary p-2">
                    {method.type === "moncash" && <Smartphone className="h-5 w-5 text-primary" />}
                    {method.type === "paypal" && <Mail className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{method.label}</p>
                      {method.isPrimary && (
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{method.value}</p>
                  </div>
                </div>
                {selectedMethod === method.id && <Check className="h-5 w-5 text-primary" />}
              </div>
            ))}
          </RadioGroup>

          <Button variant="outline" className="w-full gap-2 bg-transparent" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Add New Payout Method
          </Button>
        </CardContent>
      </Card>

      {showAddForm && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Add Payout Method</CardTitle>
            <CardDescription>Choose a method to receive your earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {!addMethodType ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setAddMethodType("moncash")}
                  className="flex flex-col items-center gap-3 rounded-lg border border-border/50 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">MonCash</p>
                    <p className="text-sm text-muted-foreground">Mobile money transfer</p>
                  </div>
                </button>
                <button
                  onClick={() => setAddMethodType("paypal")}
                  className="flex flex-col items-center gap-3 rounded-lg border border-border/50 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">PayPal</p>
                    <p className="text-sm text-muted-foreground">Online payments</p>
                  </div>
                </button>
                <button
                  onClick={() => setAddMethodType("card")}
                  className="flex flex-col items-center gap-3 rounded-lg border border-border/50 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="rounded-lg bg-primary/10 p-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Debit Card</p>
                    <p className="text-sm text-muted-foreground">Direct to card</p>
                  </div>
                </button>
                <button
                  onClick={() => setAddMethodType("bank")}
                  className="flex flex-col items-center gap-3 rounded-lg border border-border/50 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Bank Account</p>
                    <p className="text-sm text-muted-foreground">Bank transfer</p>
                  </div>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {addMethodType === "moncash" && (
                  <div className="space-y-2">
                    <Label htmlFor="moncashNumber">MonCash Number</Label>
                    <Input id="moncashNumber" placeholder="+509 XXXX-XXXX" className="bg-secondary/50" />
                  </div>
                )}
                {addMethodType === "paypal" && (
                  <div className="space-y-2">
                    <Label htmlFor="paypalEmail">PayPal Email</Label>
                    <Input id="paypalEmail" type="email" placeholder="you@example.com" className="bg-secondary/50" />
                  </div>
                )}
                {addMethodType === "card" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="bg-secondary/50" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" className="bg-secondary/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" className="bg-secondary/50" />
                      </div>
                    </div>
                  </>
                )}
                {addMethodType === "bank" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" placeholder="Bank of Haiti" className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" placeholder="XXXXXXXXXXXX" className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routingNumber">Routing Number</Label>
                      <Input id="routingNumber" placeholder="XXXXXXXXX" className="bg-secondary/50" />
                    </div>
                  </>
                )}
                <div className="flex gap-3">
                  <Button type="submit">Save Method</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddMethodType(null)
                      setShowAddForm(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
          <CardDescription>Choose how often you want to receive your earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="bi-weekly">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">
                  <p className="font-medium">Weekly</p>
                  <p className="text-sm text-muted-foreground">Every Monday</p>
                </Label>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="bi-weekly" id="bi-weekly" />
                <Label htmlFor="bi-weekly" className="cursor-pointer">
                  <p className="font-medium">Bi-weekly</p>
                  <p className="text-sm text-muted-foreground">1st and 15th of each month</p>
                </Label>
              </div>
              <Badge variant="secondary">Recommended</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  <p className="font-medium">Monthly</p>
                  <p className="text-sm text-muted-foreground">1st of each month</p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
