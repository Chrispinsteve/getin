"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * PublicNav - Navigation for unauthenticated/public pages
 * 
 * Used in: (main) route group - landing page, listings, listing details
 * Features: No Supabase calls, no auth state, pure static navigation
 */
export function PublicNav() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-base">G</span>
            </div>
            <span className="text-xl font-bold text-foreground">GetIn</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="text-foreground/80 hover:text-foreground rounded-full"
            >
              <Link href="/listings">
                <Search className="w-4 h-4 mr-2" />
                Explorer
              </Link>
            </Button>

            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/login">Connexion</Link>
            </Button>

            <Button asChild variant="outline" className="rounded-full">
              <Link href="/signup">Inscription</Link>
            </Button>

            <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
              <Link href="/become-a-host">Devenir hôte</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border bg-background/95 backdrop-blur-lg">
            <div className="flex flex-col gap-2">
              <Button
                asChild
                variant="ghost"
                className="justify-start"
                onClick={closeMobileMenu}
              >
                <Link href="/listings">
                  <Search className="w-4 h-4 mr-2" />
                  Explorer les logements
                </Link>
              </Button>

              <div className="border-t border-border my-2" />

              <Button
                asChild
                variant="ghost"
                className="justify-start"
                onClick={closeMobileMenu}
              >
                <Link href="/login">Connexion</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="justify-start"
                onClick={closeMobileMenu}
              >
                <Link href="/signup">Inscription</Link>
              </Button>

              <Button
                asChild
                className="bg-primary text-primary-foreground"
                onClick={closeMobileMenu}
              >
                <Link href="/become-a-host">Devenir hôte</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
