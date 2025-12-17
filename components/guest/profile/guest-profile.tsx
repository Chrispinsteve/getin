"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  CreditCard,
  LogOut,
  ChevronRight,
  Star,
  Calendar
} from "lucide-react"
import Link from "next/link"

interface GuestProfileProps {
  user: {
    id: string
    email: string
    fullName: string
    avatar?: string
    phone?: string
    location?: string
    memberSince: Date
    verifiedEmail?: boolean
    verifiedPhone?: boolean
  }
  stats: {
    totalTrips: number
    reviewsGiven: number
    averageRating?: number
  }
  onUpdateProfile?: (data: Partial<GuestProfileProps["user"]>) => Promise<void>
  onLogout?: () => void
}

export function GuestProfile({ user, stats, onUpdateProfile, onLogout }: GuestProfileProps) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    phone: user.phone || "",
    location: user.location || "",
  })

  const handleSave = async () => {
    if (onUpdateProfile) {
      await onUpdateProfile(formData)
    }
    setEditing(false)
  }

  const memberSinceYear = new Date(user.memberSince).getFullYear()

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">
                  {user.fullName.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-4 text-xl font-semibold">{user.fullName}</h2>
            <p className="text-sm text-muted-foreground">
              Membre depuis {memberSinceYear}
            </p>

            {/* Stats */}
            <div className="mt-4 grid w-full grid-cols-3 gap-4 border-t pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalTrips}</p>
                <p className="text-xs text-muted-foreground">Voyages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.reviewsGiven}</p>
                <p className="text-xs text-muted-foreground">Avis donnés</p>
              </div>
              <div className="text-center">
                {stats.averageRating ? (
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold">-</p>
                )}
                <p className="text-xs text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Informations personnelles</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => editing ? handleSave() : setEditing(true)}
            >
              {editing ? "Enregistrer" : "Modifier"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+509..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Port-au-Prince, Haïti"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Email</p>
                </div>
                {user.verifiedEmail && (
                  <Shield className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.phone || "Non renseigné"}</p>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                </div>
                {user.verifiedPhone && (
                  <Shield className="h-4 w-4 text-green-600" />
                )}
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.location || "Non renseigné"}</p>
                  <p className="text-xs text-muted-foreground">Localisation</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardContent className="p-0">
          <Link href="/profil/payments" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Moyens de paiement</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Separator />
          <Link href="/profil/security" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Sécurité du compte</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Separator />
          <Link href="/profil/history" className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Historique des voyages</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        className="w-full text-destructive hover:text-destructive"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Se déconnecter
      </Button>
    </div>
  )
}
