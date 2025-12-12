import { DashboardHeader } from "@/components/dashboard/header"
import { ListingsGrid } from "@/components/dashboard/listings-grid"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getHostListings } from "../actions"

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const status = params.status as "draft" | "published" | "archived" | undefined

  const { listings } = await getHostListings()

  const allListings = await getHostListings()
  const publishedListings = await getHostListings("published")
  const draftListings = await getHostListings("draft")

  const filteredListings = status ? listings.filter((l) => l.status === status) : listings

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Listings" subtitle="Manage all your property listings" />
      <div className="p-3 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto md:gap-4">
            <Link href="/dashboard/listings">
              <Button
                variant={!status ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0 text-xs md:text-sm"
              >
                All ({allListings.listings.length})
              </Button>
            </Link>
            <Link href="/dashboard/listings?status=published">
              <Button
                variant={status === "published" ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0 text-xs md:text-sm"
              >
                Active ({publishedListings.listings.length})
              </Button>
            </Link>
            <Link href="/dashboard/listings?status=draft">
              <Button
                variant={status === "draft" ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0 text-xs md:text-sm"
              >
                Drafts ({draftListings.listings.length})
              </Button>
            </Link>
          </div>
          <div className="flex gap-2">
            <Link href="/become-a-host" className="shrink-0">
              <Button className="w-full gap-1.5 text-xs md:w-auto md:gap-2 md:text-sm">
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                Create New Listing
              </Button>
            </Link>
          </div>
        </div>
        <ListingsGrid listings={filteredListings} />
      </div>
    </div>
  )
}
