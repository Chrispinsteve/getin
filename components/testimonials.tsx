"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "GetIn doubled my bookings in just two months. The smart pricing feature alone has increased my revenue by 40%.",
    name: "Marie Jean-Baptiste",
    role: "Host since 2023",
    location: "Port-au-Prince",
    avatar: "MJ",
  },
  {
    quote:
      "Payouts are instant. No more waiting weeks for my money. This is a game changer for hosts who depend on steady income.",
    name: "Jean-Pierre Louis",
    role: "Superhost",
    location: "Cap-Haïtien",
    avatar: "JP",
  },
  {
    quote: "Finally a platform that respects hosts. Lower fees, better support, and guests that actually get verified.",
    name: "Sophia Duval",
    role: "Property Manager",
    location: "Jacmel",
    avatar: "SD",
  },
  {
    quote:
      "The automation features save me hours every week. Check-in instructions, cleaning schedules — it's all handled.",
    name: "Marcus Bien-Aimé",
    role: "Multi-property Host",
    location: "Pétion-Ville",
    avatar: "MB",
  },
]

export function Testimonials() {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length)
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Trusted by Hosts</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3 text-balance">Hear from Our Community</h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Testimonial Card */}
          <div className="bg-card rounded-3xl border border-border p-8 sm:p-12 shadow-lg">
            <Quote className="w-12 h-12 text-primary/20 mb-6" />
            <blockquote className="text-xl sm:text-2xl text-card-foreground leading-relaxed mb-8">
              "{testimonials[current].quote}"
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{testimonials[current].avatar}</span>
              </div>
              <div>
                <p className="font-semibold text-card-foreground">{testimonials[current].name}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonials[current].role} • {testimonials[current].location}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === current ? "bg-primary w-8" : "bg-muted hover:bg-muted-foreground/30"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-12 h-12 rounded-full border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
