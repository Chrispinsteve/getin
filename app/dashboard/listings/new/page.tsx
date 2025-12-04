import { redirect } from "next/navigation"

export default function NewListingPage() {
  // Redirect to the onboarding flow for creating new listings
  redirect("/become-a-host")
}
