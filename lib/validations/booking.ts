import { z } from "zod"

export const bookingSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  check_in: z.string().date(),
  check_out: z.string().date(),
  guests: z.number().min(1, "At least 1 guest is required"),
  total_price: z.number().min(0, "Total price must be positive"),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("pending"),
  guest_name: z.string().min(1, "Guest name is required"),
  guest_email: z.string().email("Invalid email address"),
  guest_phone: z.string().optional(),
  special_requests: z.string().optional(),
})

export type BookingFormData = z.infer<typeof bookingSchema>

export const createBookingSchema = bookingSchema.omit({ status: true })

