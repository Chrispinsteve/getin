import { z } from "zod"

// =====================================================
// PROFILE SCHEMAS
// =====================================================

export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(true),
  push: z.boolean().default(true),
})

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional(),
})

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  phone: z.string().min(8).max(20).optional(),
  date_of_birth: z.string().date().optional(),
  nationality: z.string().min(2).max(100).optional(),
  address_line_1: z.string().max(200).optional(),
  address_line_2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().min(2).max(100).optional(),
  preferred_language: z.string().default("fr"),
  preferred_currency: z.string().default("HTG"),
  notification_preferences: notificationPreferencesSchema.optional(),
  emergency_contact: emergencyContactSchema.optional().nullable(),
  bio: z.string().max(500).optional(),
  work: z.string().max(100).optional(),
  languages: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>

// =====================================================
// GUEST PREFERENCES SCHEMAS
// =====================================================

export const travelStyleSchema = z.enum([
  "business",
  "leisure",
  "family",
  "adventure",
  "luxury",
  "budget",
])

export const guestPreferencesSchema = z.object({
  preferred_property_types: z.array(z.string()).default([]),
  preferred_amenities: z.array(z.string()).default([]),
  preferred_locations: z.array(z.string()).default([]),
  price_range_min: z.number().min(0).optional().nullable(),
  price_range_max: z.number().min(0).optional().nullable(),
  preferred_check_in_time: z.string().optional().nullable(),
  preferred_check_out_time: z.string().optional().nullable(),
  accessibility_needs: z.array(z.string()).default([]),
  dietary_requirements: z.array(z.string()).default([]),
  travel_style: travelStyleSchema.optional().nullable(),
})

export type GuestPreferencesFormData = z.infer<typeof guestPreferencesSchema>

// =====================================================
// BOOKING SCHEMAS
// =====================================================

export const paymentMethodSchema = z.enum([
  "moncash",
  "paypal",
  "stripe",
  "bank_transfer",
  "cash",
])

export const createBookingSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  check_in: z.string().date("Invalid check-in date"),
  check_out: z.string().date("Invalid check-out date"),
  num_guests: z.number().min(1, "At least 1 guest required").max(50, "Maximum 50 guests"),
  num_adults: z.number().min(1).default(1),
  num_children: z.number().min(0).default(0),
  num_infants: z.number().min(0).default(0),
  num_pets: z.number().min(0).default(0),
  guest_message: z.string().max(1000).optional(),
  special_requests: z.string().max(1000).optional(),
  promo_code: z.string().max(50).optional(),
  payment_method: paymentMethodSchema,
}).refine(
  (data) => new Date(data.check_out) > new Date(data.check_in),
  { message: "Check-out must be after check-in", path: ["check_out"] }
)

export type CreateBookingFormData = z.infer<typeof createBookingSchema>

export const cancelBookingSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  reason: z.string().max(500).optional(),
})

export type CancelBookingFormData = z.infer<typeof cancelBookingSchema>

export const bookingStatusSchema = z.enum([
  "pending",
  "accepted",
  "confirmed",
  "declined",
  "cancelled",
  "cancelled_by_guest",
  "cancelled_by_host",
  "completed",
  "no_show",
])

// =====================================================
// PAYMENT SCHEMAS
// =====================================================

export const billingAddressSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
})

export const paymentMethodTypeSchema = z.enum([
  "moncash",
  "paypal",
  "stripe_card",
  "bank_account",
])

export const addPaymentMethodSchema = z.object({
  method_type: paymentMethodTypeSchema,
  nickname: z.string().max(50).optional(),
  moncash_phone: z.string().min(8).max(15).optional(),
  paypal_email: z.string().email().optional(),
  stripe_payment_method_id: z.string().optional(),
  billing_address: billingAddressSchema.optional(),
  is_default: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.method_type === "moncash" && !data.moncash_phone) {
      return false
    }
    if (data.method_type === "paypal" && !data.paypal_email) {
      return false
    }
    if (data.method_type === "stripe_card" && !data.stripe_payment_method_id) {
      return false
    }
    return true
  },
  { message: "Required fields missing for payment method type" }
)

export type AddPaymentMethodFormData = z.infer<typeof addPaymentMethodSchema>

export const processPaymentSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  payment_method_id: z.string().uuid().optional(),
  payment_method: paymentMethodSchema,
  amount: z.number().min(1, "Amount must be positive"),
  currency: z.string().default("HTG"),
  return_url: z.string().url().optional(),
})

export type ProcessPaymentFormData = z.infer<typeof processPaymentSchema>

// MonCash specific
export const moncashPaymentSchema = z.object({
  booking_id: z.string().uuid(),
  phone: z.string().min(8).max(15),
  amount: z.number().min(1),
})

export type MonCashPaymentFormData = z.infer<typeof moncashPaymentSchema>

// =====================================================
// FAVORITES SCHEMAS
// =====================================================

export const addToFavoritesSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  collection_name: z.string().max(100).default("Favorites"),
  notes: z.string().max(500).optional(),
})

export type AddToFavoritesFormData = z.infer<typeof addToFavoritesSchema>

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false),
})

export type CreateCollectionFormData = z.infer<typeof createCollectionSchema>

export const updateCollectionSchema = createCollectionSchema.partial()

// =====================================================
// MESSAGING SCHEMAS
// =====================================================

export const messageTypeSchema = z.enum([
  "text",
  "image",
  "file",
  "system",
  "booking_request",
  "booking_confirmation",
])

export const messageAttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "file"]),
  url: z.string().url(),
  name: z.string(),
  size: z.number().optional(),
  mime_type: z.string().optional(),
})

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid("Invalid conversation ID"),
  message_text: z.string().min(1, "Message cannot be empty").max(5000),
  message_type: messageTypeSchema.default("text"),
  attachments: z.array(messageAttachmentSchema).default([]),
})

export type SendMessageFormData = z.infer<typeof sendMessageSchema>

export const startConversationSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  host_id: z.string().uuid("Invalid host ID"),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(5000),
  booking_id: z.string().uuid().optional(),
})

export type StartConversationFormData = z.infer<typeof startConversationSchema>

// =====================================================
// REVIEW SCHEMAS
// =====================================================

export const ratingSchema = z.number()
  .min(1, "Rating must be at least 1")
  .max(5, "Rating cannot exceed 5")
  .multipleOf(0.5, "Rating must be in 0.5 increments")

export const reviewPhotoSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(200).optional(),
})

export const createReviewSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  overall_rating: ratingSchema,
  cleanliness_rating: ratingSchema.optional(),
  accuracy_rating: ratingSchema.optional(),
  communication_rating: ratingSchema.optional(),
  location_rating: ratingSchema.optional(),
  check_in_rating: ratingSchema.optional(),
  value_rating: ratingSchema.optional(),
  review_text: z.string().max(5000).optional(),
  private_feedback: z.string().max(2000).optional(),
  photos: z.array(reviewPhotoSchema).max(10).default([]),
})

export type CreateReviewFormData = z.infer<typeof createReviewSchema>

export const updateReviewSchema = createReviewSchema.partial().omit({ booking_id: true })

// =====================================================
// CHECK-IN / CHECK-OUT SCHEMAS
// =====================================================

export const checkInPhotoSchema = z.object({
  url: z.string().url(),
  area: z.string().min(1),
  notes: z.string().max(500).optional(),
})

export const completeCheckInSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  property_photos: z.array(checkInPhotoSchema).default([]),
  guest_acknowledged_rules: z.boolean().refine(val => val === true, {
    message: "You must acknowledge the house rules",
  }),
  issues_reported: z.string().max(1000).optional(),
})

export type CompleteCheckInFormData = z.infer<typeof completeCheckInSchema>

export const propertyConditionSchema = z.enum([
  "excellent",
  "good",
  "fair",
  "poor",
  "damaged",
])

export const completeCheckOutSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  property_photos: z.array(checkInPhotoSchema).default([]),
  property_condition: propertyConditionSchema.optional(),
  items_left_behind: z.string().max(500).optional(),
  guest_feedback: z.string().max(1000).optional(),
  keys_returned: z.boolean().default(true),
})

export type CompleteCheckOutFormData = z.infer<typeof completeCheckOutSchema>

export const requestLateCheckoutSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  requested_time: z.string(),
  reason: z.string().max(500).optional(),
})

export type RequestLateCheckoutFormData = z.infer<typeof requestLateCheckoutSchema>

// =====================================================
// SEARCH SCHEMAS
// =====================================================

export const searchFiltersSchema = z.object({
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(1).max(500).optional(),
  check_in: z.string().date().optional(),
  check_out: z.string().date().optional(),
  num_guests: z.number().min(1).max(50).optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  property_types: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  min_bedrooms: z.number().min(0).optional(),
  min_beds: z.number().min(0).optional(),
  min_bathrooms: z.number().min(0).optional(),
  instant_book: z.boolean().optional(),
  superhost: z.boolean().optional(),
  min_rating: z.number().min(0).max(5).optional(),
})

export type SearchFiltersFormData = z.infer<typeof searchFiltersSchema>

export const searchSortSchema = z.enum([
  "relevance",
  "price_asc",
  "price_desc",
  "rating",
  "reviews",
  "newest",
  "distance",
])

export const searchParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort: searchSortSchema.default("relevance"),
  filters: searchFiltersSchema.optional(),
})

export type SearchParamsFormData = z.infer<typeof searchParamsSchema>

// =====================================================
// VERIFICATION SCHEMAS
// =====================================================

export const verificationTypeSchema = z.enum([
  "email",
  "phone",
  "id_document",
  "address",
  "selfie",
])

export const idDocumentTypeSchema = z.enum([
  "passport",
  "national_id",
  "drivers_license",
])

export const submitEmailVerificationSchema = z.object({
  email: z.string().email("Invalid email"),
})

export const verifyEmailCodeSchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().length(6, "Code must be 6 digits"),
})

export const submitPhoneVerificationSchema = z.object({
  phone: z.string().min(8, "Invalid phone number").max(20),
})

export const verifyPhoneCodeSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().length(6, "Code must be 6 digits"),
})

export const submitIdVerificationSchema = z.object({
  document_type: idDocumentTypeSchema,
  document_url: z.string().url("Invalid document URL"),
  selfie_url: z.string().url("Invalid selfie URL").optional(),
})

export type SubmitEmailVerificationFormData = z.infer<typeof submitEmailVerificationSchema>
export type VerifyEmailCodeFormData = z.infer<typeof verifyEmailCodeSchema>
export type SubmitPhoneVerificationFormData = z.infer<typeof submitPhoneVerificationSchema>
export type VerifyPhoneCodeFormData = z.infer<typeof verifyPhoneCodeSchema>
export type SubmitIdVerificationFormData = z.infer<typeof submitIdVerificationSchema>

// =====================================================
// PROMO CODE SCHEMAS
// =====================================================

export const validatePromoCodeSchema = z.object({
  code: z.string().min(1, "Promo code is required").max(50),
  listing_id: z.string().uuid().optional(),
  booking_amount: z.number().min(0).optional(),
})

export type ValidatePromoCodeFormData = z.infer<typeof validatePromoCodeSchema>

// =====================================================
// NOTIFICATION SCHEMAS
// =====================================================

export const markNotificationReadSchema = z.object({
  notification_id: z.string().uuid(),
})

export const markAllNotificationsReadSchema = z.object({
  before: z.string().datetime().optional(),
})

// =====================================================
// INQUIRY SCHEMA
// =====================================================

export const sendInquirySchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  check_in: z.string().date().optional(),
  check_out: z.string().date().optional(),
  num_guests: z.number().min(1).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
})

export type SendInquiryFormData = z.infer<typeof sendInquirySchema>
