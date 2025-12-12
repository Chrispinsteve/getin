"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Star, Clock, MessageSquare } from "lucide-react"

const languages = [
  { id: "en", label: "English" },
  { id: "fr", label: "French" },
  { id: "es", label: "Spanish" },
  { id: "ht", label: "Haitian Creole" },
  { id: "pt", label: "Portuguese" },
]

export function HostProfile() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en", "fr", "ht"])

  const toggleLanguage = (langId: string, checked: boolean) => {
    if (checked) {
      setSelectedLanguages([...selectedLanguages, langId])
    } else {
      setSelectedLanguages(selectedLanguages.filter((id) => id !== langId))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // UI placeholder only
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Add a photo to help guests recognize you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/host-profile.jpg" />
                <AvatarFallback className="text-2xl">JD</AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="font-medium">John Doe</p>
              <p className="text-sm text-muted-foreground">Host since 2023</p>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-medium">4.9 rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">98% response rate</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Tell guests about yourself</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue="John" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue="Doe" className="bg-secondary/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">About Me</Label>
            <Textarea
              id="bio"
              rows={4}
              defaultValue="Hi! I'm John, a passionate host who loves sharing the beauty of Haiti with travelers from around the world. I've been hosting for over 2 years and take pride in creating memorable experiences for my guests."
              className="bg-secondary/50"
            />
            <p className="text-sm text-muted-foreground">Write a short bio to introduce yourself to potential guests</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Hosting Experience</CardTitle>
          <CardDescription>Share your hosting background</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Select defaultValue="2">
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">New to hosting</SelectItem>
                <SelectItem value="1">1 year</SelectItem>
                <SelectItem value="2">2 years</SelectItem>
                <SelectItem value="3">3 years</SelectItem>
                <SelectItem value="5">5+ years</SelectItem>
                <SelectItem value="10">10+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Languages Spoken</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {languages.map((lang) => (
                <div key={lang.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={lang.id}
                    checked={selectedLanguages.includes(lang.id)}
                    onCheckedChange={(checked) => toggleLanguage(lang.id, checked as boolean)}
                  />
                  <Label htmlFor={lang.id} className="text-sm font-normal cursor-pointer">
                    {lang.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Response Settings</CardTitle>
          <CardDescription>Set your typical response time for guest inquiries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responseTime">Typical Response Time</Label>
              <Select defaultValue="1">
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select response time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">Within 30 minutes</SelectItem>
                  <SelectItem value="1">Within an hour</SelectItem>
                  <SelectItem value="2">Within a few hours</SelectItem>
                  <SelectItem value="24">Within 24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-accent/10 p-4">
              <Clock className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium">Quick responders get more bookings</p>
                <p className="text-sm text-muted-foreground">
                  Hosts who respond within an hour are 3x more likely to get booked
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Profile Badges</CardTitle>
          <CardDescription>Badges earned based on your hosting performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              <Star className="mr-1 h-3 w-3" />
              Superhost
            </Badge>
            <Badge variant="secondary">Quick Responder</Badge>
            <Badge variant="secondary">Experienced Host</Badge>
            <Badge variant="outline">Verified ID</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">Save Profile</Button>
      </div>
    </form>
  )
}
