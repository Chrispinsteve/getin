import { z } from "zod"

export const listingSchema = z.object({
  property_type: z.string().min(1, "Property type is required"),
  country: z.string().min(1, "Country is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zip: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.object({
    url: z.string().url(),
    caption: z.string().optional(),
  })).default([]),
  base_price: z.number().min(0, "Base price must be positive"),
  cleaning_fee: z.number().min(0).optional(),
  additional_guest_fee: z.number().min(0).optional(),
  smart_pricing: z.boolean().default(false),
  instant_book: z.boolean().default(false),
  blocked_dates: z.array(z.string()).default([]),
  min_stay: z.number().min(1).optional(),
  max_stay: z.number().min(1).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
})

export type ListingFormData = z.infer<typeof listingSchema>

