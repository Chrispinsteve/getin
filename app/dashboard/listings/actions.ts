"use server"

import { 
  getListingById as _getListingById,
  updateListing as _updateListing,
  deleteListing as _deleteListing,
  toggleListingStatus as _toggleListingStatus,
  type ListingInput
} from "@/app/dashboard/actions"

export async function getListingById(id: string) {
  return _getListingById(id)
}

export async function updateListing(
  id: string,
  data: ListingInput,
  status?: "draft" | "published" | "archived"
) {
  return _updateListing(id, data, status)
}

export async function deleteListing(id: string) {
  return _deleteListing(id)
}

export async function toggleListingStatus(id: string, currentStatus: string) {
  return _toggleListingStatus(id, currentStatus)
}
