import { Suspense } from "react"
import { SignUpForm } from "@/components/auth/signup-form"
import { Skeleton } from "@/components/ui/skeleton"

function SignupFormFallback() {
  return (
    <div className="w-full max-w-md space-y-6 p-6">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFormFallback />}>
      <SignUpForm />
    </Suspense>
  )
}
