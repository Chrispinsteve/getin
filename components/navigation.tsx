"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Plane, Heart, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type UserRole = "guest" | "host" | null

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("roles")
          .eq("id", user.id)
          .single()

        const roles = profile?.roles || []
        if (roles.includes("host")) {
          setUserRole("host")
        } else if (roles.includes("guest")) {
          setUserRole("guest")
        }
      }
      setLoading(false)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (!session?.user) {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    window.location.href = "/"
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-card/80 backdrop-blur-xl border-b border-border shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold text-foreground">GetIn</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" className="text-foreground/80 hover:text-foreground">
              <Link href="/listings">Browse Stays</Link>
            </Button>

            {loading ? null : user ? (
              <>
                {/* Guest Navigation Links */}
                {userRole === "guest" && (
                  <>
                    <Button asChild variant="ghost" className="text-foreground/80 hover:text-foreground">
                      <Link href="/guest/voyages">
                        <Plane className="h-4 w-4 mr-2" />
                        My Trips
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="text-foreground/80 hover:text-foreground">
                      <Link href="/guest/favoris">
                        <Heart className="h-4 w-4 mr-2" />
                        Favorites
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="text-foreground/80 hover:text-foreground">
                      <Link href="/guest/profil">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </Button>
                  </>
                )}

                {/* Host Navigation Links */}
                {userRole === "host" && (
                  <Button asChild variant="ghost" className="text-foreground/80 hover:text-foreground">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                )}

                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/signup">Sign Up</Link>
                </Button>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link href="/become-a-host">Become a Host</Link>
                </Button>
              </>
            )}
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
          <div className="md:hidden py-4 border-t border-border bg-card/95 backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              <Button asChild variant="ghost" className="justify-start text-foreground/80">
                <Link href="/listings">Browse Stays</Link>
              </Button>

              {user ? (
                <>
                  {/* Guest Mobile Links */}
                  {userRole === "guest" && (
                    <>
                      <Button asChild variant="ghost" className="justify-start text-foreground/80">
                        <Link href="/guest/voyages">
                          <Plane className="h-4 w-4 mr-2" />
                          My Trips
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" className="justify-start text-foreground/80">
                        <Link href="/guest/favoris">
                          <Heart className="h-4 w-4 mr-2" />
                          Favorites
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" className="justify-start text-foreground/80">
                        <Link href="/guest/profil">
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                      </Button>
                    </>
                  )}

                  {/* Host Mobile Link */}
                  {userRole === "host" && (
                    <Button asChild variant="ghost" className="justify-start text-foreground/80">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  )}

                  <Button variant="outline" className="justify-start" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" className="justify-start text-foreground/80">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start bg-transparent">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                  <Button asChild className="bg-primary text-primary-foreground">
                    <Link href="/become-a-host">Become a Host</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
