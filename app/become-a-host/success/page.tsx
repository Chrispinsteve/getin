import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Home, Sparkles } from "lucide-react"

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>
}) {
  const params = await searchParams
  const isDraft = params.draft === "true"

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-foreground">{isDraft ? "Draft Saved!" : "Listing Published!"}</h1>

        <p className="mb-8 text-muted-foreground">
          {isDraft
            ? "Your listing has been saved as a draft. You can continue editing it anytime from your dashboard."
            : "Congratulations! Your property is now live on GetIn. Travelers can start booking your space right away."}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          {!isDraft && (
            <Button asChild variant="outline" size="lg">
              <Link href="/become-a-host">
                <Sparkles className="mr-2 h-4 w-4" />
                Create Another
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
