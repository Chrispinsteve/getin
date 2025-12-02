"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, TrendingUp, Headphones, UserCheck, ArrowRight } from "lucide-react"
import { AnimatedCardStack } from "@/components/animated-card-stack"

export function HeroSection() {
  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/50" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance leading-[1.1]">
                Turn Your Space Into Income — <span className="text-primary">Effortlessly.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Host smarter, earn faster, reach travelers who love your space.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 h-12 rounded-full group"
              >
                Become a Host
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-muted text-base px-8 h-12 rounded-full bg-transparent"
              >
                Learn How Hosting Works
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-full">
                <Shield className="w-4 h-4 mr-1.5 text-accent" />
                Secure payouts
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-full">
                <TrendingUp className="w-4 h-4 mr-1.5 text-primary" />
                Smart pricing
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-full">
                <Headphones className="w-4 h-4 mr-1.5 text-accent" />
                24/7 support
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-muted text-muted-foreground rounded-full">
                <UserCheck className="w-4 h-4 mr-1.5 text-primary" />
                Verified guests
              </Badge>
            </div>
          </div>

          {/* Right Visual - Animated Card Stack */}
          <div className="relative lg:pl-8">
            <AnimatedCardStack />
          </div>
        </div>
      </div>
    </section>
  )
}
