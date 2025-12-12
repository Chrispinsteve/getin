"use client"

import { useActionState } from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { signUp, type AuthState } from "@/app/(auth)/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    signUp,
    null
  )

  // Show success message if email confirmation is required
  if (state?.success) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardContent className="pt-6">
          <Alert className="border-accent bg-accent/10">
            <CheckCircle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-foreground">
              {state.error || "Vérifiez votre email pour confirmer votre inscription."}
            </AlertDescription>
          </Alert>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Créez votre compte</CardTitle>
        <CardDescription className="text-muted-foreground">
          Commencez à héberger et à gagner avec GetIn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.error && !state?.success && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Jean"
                className="h-11 bg-secondary/50"
                required
                disabled={isPending}
                aria-describedby={state?.fieldErrors?.firstName ? "firstName-error" : undefined}
              />
              {state?.fieldErrors?.firstName && (
                <p id="firstName-error" className="text-sm text-destructive">
                  {state.fieldErrors.firstName[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Dupont"
                className="h-11 bg-secondary/50"
                required
                disabled={isPending}
                aria-describedby={state?.fieldErrors?.lastName ? "lastName-error" : undefined}
              />
              {state?.fieldErrors?.lastName && (
                <p id="lastName-error" className="text-sm text-destructive">
                  {state.fieldErrors.lastName[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.com"
              className="h-11 bg-secondary/50"
              required
              disabled={isPending}
              aria-describedby={state?.fieldErrors?.email ? "email-error" : undefined}
            />
            {state?.fieldErrors?.email && (
              <p id="email-error" className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 bg-secondary/50 pr-10"
                required
                minLength={8}
                disabled={isPending}
                aria-describedby={state?.fieldErrors?.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {state?.fieldErrors?.password && (
              <p id="password-error" className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Au moins 8 caractères</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-11 bg-secondary/50 pr-10"
                required
                disabled={isPending}
                aria-describedby={state?.fieldErrors?.confirmPassword ? "confirmPassword-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {state?.fieldErrors?.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="h-11 w-full text-base font-medium"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création du compte...
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            En créant un compte, vous acceptez nos{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Politique de confidentialité
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}