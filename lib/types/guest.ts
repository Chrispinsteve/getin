import type { Database as BaseDatabase } from "./database"

// =====================================================
// GUEST BACKEND TYPES
// =====================================================

// Extended Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =====================================================
// USER & PROFILE TYPES
// =====================================================

export type UserRole = "guest" | "host" | "admin"

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  roles: UserRole[]
  phone: string | null
  phone_verified: boolean
  email_verified: boolean
  id_verified: boolean
  id_document_url: string | null
  id_document_type: "passport" | "national_id" | "drivers_license" | null
  id_verified_at: string | null
  date_of_birth: string | null
  nationality: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  preferred_language: string
  preferred_currency: string
  notification_preferences: NotificationPreferences
  emergency_contact: EmergencyContact | null
  bio: string | null
  work: string | null
  languages: string[]
  interests: string[]
  profile_completion_percentage: number
  last_active_at: string | null
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface ProfileUpdate {
  full_name?: string
  avatar_url?: string
  phone?: string
  date_of_birth?: string
  nationality?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  preferred_language?: string
  preferred_currency?: string
  notification_preferences?: NotificationPreferences
  emergency_contact?: EmergencyContact
  bio?: string
  work?: string
  languages?: string[]
  interests?: string[]
}

// =====================================================
// GUEST PREFERENCES
// =====================================================

export interface GuestPreferences {
  id: string
  user_id: string
  preferred_property_types: string[]
  preferred_amenities: string[]
  preferred_locations: string[]
  price_range_min: number | null
  price_range_max: number | null
  preferred_check_in_time: string | null
  preferred_check_out_time: string | null
  accessibility_needs: string[]
  dietary_requirements: string[]
  travel_style: TravelStyle | null
  created_at: string
  updated_at: string
}

export type TravelStyle = "business" | "leisure" | "family" | "adventure" | "luxury" | "budget"

export interface GuestPreferencesUpdate {
  preferred_property_types?: string[]
  preferred_amenities?: string[]
  preferred_locations?: string[]
  price_range_min?: number
  price_range_max?: number
  preferred_check_in_time?: string
  preferred_check_out_time?: string
  accessibility_needs?: string[]
  dietary_requirements?: string[]
  travel_style?: TravelStyle
}

// =====================================================
// BOOKING TYPES
// =====================================================

export type BookingStatus = 
  | "pending" 
  | "accepted" 
  | "confirmed" 
  | "declined" 
  | "cancelled" 
  | "cancelled_by_guest" 
  | "cancelled_by_host" 
  | "completed" 
  | "no_show"

export type PaymentStatus = 
  | "pending" 
  | "authorized" 
  | "captured" 
  | "partially_refunded" 
  | "refunded" 
  | "failed"

export type PaymentMethod = "moncash" | "paypal" | "stripe" | "bank_transfer" | "cash"

export type RefundStatus = "none" | "requested" | "processing" | "completed" | "denied"

export interface GuestBooking {
  id: string
  booking_reference: string
  listing_id: string
  guest_id: string
  host_id: string
  check_in: string
  check_out: string
  nights: number
  num_guests: number
  num_adults: number
  num_children: number
  num_infants: number
  num_pets: number
  base_price_per_night: number
  total_nights_cost: number
  cleaning_fee: number
  service_fee: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  host_payout: number
  currency: string
  status: BookingStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  payment_intent_id: string | null
  payment_provider_reference: string | null
  paid_at: string | null
  accepted_at: string | null
  declined_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  refund_amount: number | null
  refund_status: RefundStatus | null
  guest_message: string | null
  host_message: string | null
  special_requests: string | null
  check_in_time: string | null
  check_out_time: string | null
  is_instant_book: boolean
  promo_code: string | null
  confirmation_sent_at: string | null
  reminder_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface GuestBookingWithRelations extends GuestBooking {
  listing?: {
    id: string
    title: string
    property_type: string
    city: string
    state: string | null
    country: string
    photos: ListingPhoto[]
    base_price: number
    check_in_instructions?: string
    access_code?: string
    latitude?: number
    longitude?: number
  }
  host?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
    phone?: string
    superhost?: boolean
  }
  check_in_record?: CheckIn
  check_out_record?: CheckOut
  review?: Review
}

export interface ListingPhoto {
  id?: string
  url: string
  caption?: string
  is_cover?: boolean
  order?: number
}

export interface CreateBookingInput {
  listing_id: string
  check_in: string
  check_out: string
  num_guests: number
  num_adults?: number
  num_children?: number
  num_infants?: number
  num_pets?: number
  guest_message?: string
  special_requests?: string
  promo_code?: string
  payment_method: PaymentMethod
}

export interface BookingPriceCalculation {
  nights: number
  base_price_per_night: number
  total_nights_cost: number
  cleaning_fee: number
  service_fee: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  host_payout: number
}

// =====================================================
// PAYMENT TYPES
// =====================================================

export type PaymentType = "booking" | "deposit" | "balance" | "refund" | "damage" | "extra_service"

export interface Payment {
  id: string
  booking_id: string
  user_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_type: PaymentType
  status: "pending" | "processing" | "completed" | "failed" | "cancelled" | "refunded"
  provider_payment_id: string | null
  provider_transaction_id: string | null
  provider_reference: string | null
  provider_response: Json
  fee_amount: number
  net_amount: number | null
  metadata: Json
  error_message: string | null
  error_code: string | null
  processed_at: string | null
  created_at: string
  updated_at: string
}

export type PaymentMethodType = "moncash" | "paypal" | "stripe_card" | "bank_account"

export interface SavedPaymentMethod {
  id: string
  user_id: string
  method_type: PaymentMethodType
  is_default: boolean
  nickname: string | null
  // MonCash
  moncash_phone: string | null
  // PayPal
  paypal_email: string | null
  paypal_payer_id: string | null
  // Stripe
  stripe_customer_id: string | null
  stripe_payment_method_id: string | null
  card_last_four: string | null
  card_brand: string | null
  card_exp_month: number | null
  card_exp_year: number | null
  // Bank
  bank_name: string | null
  bank_account_last_four: string | null
  // Common
  billing_address: BillingAddress | null
  is_verified: boolean
  verified_at: string | null
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface BillingAddress {
  line1: string
  line2?: string
  city: string
  state?: string
  postal_code: string
  country: string
}

export interface AddPaymentMethodInput {
  method_type: PaymentMethodType
  nickname?: string
  moncash_phone?: string
  paypal_email?: string
  stripe_payment_method_id?: string
  billing_address?: BillingAddress
  is_default?: boolean
}

// MonCash specific
export interface MonCashPaymentRequest {
  amount: number
  orderId: string
  returnUrl: string
}

export interface MonCashPaymentResponse {
  success: boolean
  payment_url?: string
  transaction_id?: string
  error?: string
}

// PayPal specific
export interface PayPalPaymentRequest {
  amount: number
  currency: string
  booking_id: string
  return_url: string
  cancel_url: string
}

export interface PayPalPaymentResponse {
  success: boolean
  approval_url?: string
  order_id?: string
  error?: string
}

// Stripe specific
export interface StripePaymentIntentRequest {
  amount: number
  currency: string
  booking_id: string
  payment_method_id?: string
}

export interface StripePaymentIntentResponse {
  success: boolean
  client_secret?: string
  payment_intent_id?: string
  status?: string
  error?: string
}

// =====================================================
// FAVORITES TYPES
// =====================================================

export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  collection_name: string
  notes: string | null
  created_at: string
}

export interface FavoriteWithListing extends Favorite {
  listing: {
    id: string
    title: string
    property_type: string
    city: string
    state: string | null
    country: string
    photos: ListingPhoto[]
    base_price: number
    average_rating: number | null
    reviews_count: number
    instant_book: boolean
  }
}

export interface FavoriteCollection {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  cover_image_url: string | null
  created_at: string
  updated_at: string
  listings_count?: number
}

export interface AddToFavoritesInput {
  listing_id: string
  collection_name?: string
  notes?: string
}

export interface CreateCollectionInput {
  name: string
  description?: string
  is_public?: boolean
}

// =====================================================
// MESSAGING TYPES
// =====================================================

export type ConversationStatus = "active" | "archived" | "blocked"
export type ConversationType = "inquiry" | "booking" | "support" | "review"
export type MessageType = "text" | "image" | "file" | "system" | "booking_request" | "booking_confirmation"

export interface Conversation {
  id: string
  listing_id: string | null
  booking_id: string | null
  host_id: string
  guest_id: string
  subject: string | null
  conversation_type: ConversationType
  status: ConversationStatus
  last_message_at: string | null
  last_message_preview: string | null
  host_unread_count: number
  guest_unread_count: number
  host_archived: boolean
  guest_archived: boolean
  created_at: string
  updated_at: string
}

export interface ConversationWithRelations extends Conversation {
  listing?: {
    id: string
    title: string
    photos: ListingPhoto[]
    city: string
  }
  host?: {
    id: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  }
  guest_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  last_message?: Message
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  message_text: string
  message_type: MessageType
  attachments: MessageAttachment[]
  is_read: boolean
  read_at: string | null
  is_deleted_by_sender: boolean
  is_deleted_by_recipient: boolean
  metadata: Json
  created_at: string
  updated_at: string
}

export interface MessageAttachment {
  id: string
  type: "image" | "file"
  url: string
  name: string
  size?: number
  mime_type?: string
}

export interface SendMessageInput {
  conversation_id: string
  message_text: string
  message_type?: MessageType
  attachments?: MessageAttachment[]
}

export interface StartConversationInput {
  listing_id: string
  host_id: string
  subject?: string
  message: string
  booking_id?: string
}

// =====================================================
// REVIEW TYPES
// =====================================================

export type ReviewType = "guest_to_host" | "host_to_guest"
export type ReviewStatus = "pending" | "published" | "hidden" | "flagged" | "removed"

export interface Review {
  id: string
  booking_id: string
  listing_id: string
  host_id: string
  reviewer_id: string
  reviewee_id: string | null
  review_type: ReviewType
  overall_rating: number
  cleanliness_rating: number | null
  accuracy_rating: number | null
  communication_rating: number | null
  location_rating: number | null
  check_in_rating: number | null
  value_rating: number | null
  review_text: string | null
  private_feedback: string | null
  host_response: string | null
  host_response_at: string | null
  photos: ReviewPhoto[]
  status: ReviewStatus
  is_featured: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface ReviewPhoto {
  id: string
  url: string
  caption?: string
}

export interface ReviewWithRelations extends Review {
  listing?: {
    id: string
    title: string
    city: string
    photos: ListingPhoto[]
  }
  reviewer?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  booking?: {
    id: string
    check_in: string
    check_out: string
  }
}

export interface CreateReviewInput {
  booking_id: string
  overall_rating: number
  cleanliness_rating?: number
  accuracy_rating?: number
  communication_rating?: number
  location_rating?: number
  check_in_rating?: number
  value_rating?: number
  review_text?: string
  private_feedback?: string
  photos?: { url: string; caption?: string }[]
}

export interface ReviewStats {
  average_rating: number
  total_reviews: number
  cleanliness_average: number | null
  accuracy_average: number | null
  communication_average: number | null
  location_average: number | null
  check_in_average: number | null
  value_average: number | null
  rating_distribution: {
    "5": number
    "4": number
    "3": number
    "2": number
    "1": number
  }
}

// =====================================================
// CHECK-IN / CHECK-OUT TYPES
// =====================================================

export type CheckInType = "self" | "host_assisted" | "keybox" | "smart_lock" | "concierge"
export type CheckInStatus = "pending" | "ready" | "in_progress" | "completed" | "missed" | "cancelled"
export type CheckOutStatus = "pending" | "in_progress" | "completed" | "late" | "extended"
export type PropertyCondition = "excellent" | "good" | "fair" | "poor" | "damaged"
export type CleaningStatus = "clean" | "needs_attention" | "requires_deep_clean"

export interface CheckIn {
  id: string
  booking_id: string
  guest_id: string
  listing_id: string
  check_in_type: CheckInType
  scheduled_time: string
  actual_time: string | null
  status: CheckInStatus
  access_code: string | null
  access_code_expires_at: string | null
  access_instructions: string | null
  property_condition_notes: string | null
  property_photos: CheckInPhoto[]
  guest_verification_photo: string | null
  guest_signature: string | null
  id_verified: boolean
  special_requests_fulfilled: string | null
  host_notes: string | null
  issues_reported: string | null
  guest_acknowledged_rules: boolean
  wifi_credentials: WifiCredentials | null
  emergency_contacts: EmergencyContactInfo[]
  local_recommendations: LocalRecommendation[]
  completed_by: string | null
  created_at: string
  updated_at: string
}

export interface CheckInPhoto {
  id: string
  url: string
  area: string
  notes?: string
  taken_at: string
}

export interface WifiCredentials {
  network_name: string
  password: string
}

export interface EmergencyContactInfo {
  name: string
  role: string
  phone: string
}

export interface LocalRecommendation {
  name: string
  type: "restaurant" | "cafe" | "attraction" | "transport" | "shopping" | "other"
  address?: string
  description?: string
  distance?: string
}

export interface CheckOut {
  id: string
  booking_id: string
  check_in_id: string | null
  guest_id: string
  listing_id: string
  scheduled_time: string
  actual_time: string | null
  status: CheckOutStatus
  checkout_instructions: string | null
  property_condition: PropertyCondition | null
  property_photos: CheckInPhoto[]
  items_left_behind: string | null
  damage_reported: string | null
  damage_photos: CheckInPhoto[]
  damage_amount: number | null
  cleaning_status: CleaningStatus | null
  host_notes: string | null
  guest_feedback: string | null
  keys_returned: boolean
  late_checkout_fee: number
  late_checkout_approved: boolean
  completed_by: string | null
  created_at: string
  updated_at: string
}

export interface CompleteCheckInInput {
  booking_id: string
  property_photos?: { url: string; area: string; notes?: string }[]
  guest_acknowledged_rules: boolean
  issues_reported?: string
}

export interface CompleteCheckOutInput {
  booking_id: string
  property_photos?: { url: string; area: string; notes?: string }[]
  property_condition?: PropertyCondition
  items_left_behind?: string
  guest_feedback?: string
  keys_returned: boolean
}

// =====================================================
// SEARCH & DISCOVERY TYPES
// =====================================================

export interface SearchFilters {
  location?: string
  latitude?: number
  longitude?: number
  radius_km?: number
  check_in?: string
  check_out?: string
  num_guests?: number
  min_price?: number
  max_price?: number
  property_types?: string[]
  amenities?: string[]
  min_bedrooms?: number
  min_beds?: number
  min_bathrooms?: number
  instant_book?: boolean
  superhost?: boolean
  min_rating?: number
}

export interface SearchParams {
  page?: number
  limit?: number
  sort?: SearchSortOption
  filters?: SearchFilters
}

export type SearchSortOption = 
  | "relevance" 
  | "price_asc" 
  | "price_desc" 
  | "rating" 
  | "reviews" 
  | "newest" 
  | "distance"

export interface SearchResult {
  listings: ListingSearchResult[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface ListingSearchResult {
  id: string
  title: string
  slug: string
  property_type: string
  city: string
  state: string | null
  country: string
  latitude: number | null
  longitude: number | null
  photos: ListingPhoto[]
  base_price: number
  cleaning_fee: number
  bedrooms: number
  beds: number
  bathrooms: number
  max_guests: number
  amenities: string[]
  average_rating: number | null
  reviews_count: number
  instant_book: boolean
  host: {
    id: string
    first_name: string
    profile_picture_url: string | null
    superhost: boolean
  } | null
  distance_km?: number
}

export interface SearchHistory {
  id: string
  user_id: string | null
  session_id: string | null
  search_query: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  check_in: string | null
  check_out: string | null
  num_guests: number | null
  filters: SearchFilters
  results_count: number | null
  created_at: string
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface GuestAnalytics {
  id: string
  user_id: string
  total_bookings: number
  total_nights_stayed: number
  total_spent: number
  average_booking_value: number
  favorite_location: string | null
  favorite_property_type: string | null
  last_booking_at: string | null
  member_since: string
  loyalty_points: number
  loyalty_tier: LoyaltyTier
  created_at: string
  updated_at: string
}

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum"

export interface GuestDashboardStats {
  total_trips: number
  upcoming_trips: number
  total_spent: number
  nights_stayed: number
  countries_visited: number
  cities_visited: number
  average_rating_given: number
  reviews_written: number
  favorites_count: number
  loyalty_points: number
  loyalty_tier: LoyaltyTier
}

export interface ListingView {
  id: string
  listing_id: string
  user_id: string | null
  session_id: string | null
  view_duration_seconds: number | null
  source: "search" | "direct" | "favorites" | "recommendation" | "share" | "map"
  device_type: "desktop" | "mobile" | "tablet"
  referrer: string | null
  created_at: string
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export type NotificationType = 
  | "booking_request" 
  | "booking_confirmed" 
  | "booking_declined" 
  | "booking_cancelled"
  | "payment_received" 
  | "payment_failed" 
  | "refund_processed"
  | "message_received" 
  | "review_received" 
  | "review_reminder"
  | "check_in_reminder" 
  | "check_out_reminder"
  | "listing_favorited" 
  | "price_drop" 
  | "special_offer"
  | "account_verified" 
  | "system_announcement"

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: Json
  action_url: string | null
  is_read: boolean
  read_at: string | null
  is_push_sent: boolean
  is_email_sent: boolean
  is_sms_sent: boolean
  created_at: string
}

// =====================================================
// PROMO CODE TYPES
// =====================================================

export type DiscountType = "percentage" | "fixed_amount"

export interface PromoCode {
  id: string
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  min_booking_amount: number | null
  max_discount_amount: number | null
  currency: string
  valid_from: string
  valid_until: string
  usage_limit: number | null
  usage_count: number
  per_user_limit: number
  applicable_listings: string[]
  applicable_property_types: string[]
  first_booking_only: boolean
  new_users_only: boolean
  is_active: boolean
  created_at: string
}

export interface ValidatePromoCodeResult {
  is_valid: boolean
  error_message: string | null
  discount_type: DiscountType | null
  discount_value: number | null
  max_discount: number | null
}

// =====================================================
// VERIFICATION TYPES
// =====================================================

export type VerificationType = "email" | "phone" | "id_document" | "address" | "selfie"
export type VerificationStatus = "pending" | "in_review" | "approved" | "rejected" | "expired"

export interface VerificationRequest {
  id: string
  user_id: string
  verification_type: VerificationType
  status: VerificationStatus
  document_url: string | null
  document_type: string | null
  submitted_data: Json
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface SubmitVerificationInput {
  verification_type: VerificationType
  document_url?: string
  document_type?: string
  submitted_data?: {
    phone?: string
    email?: string
    code?: string
    [key: string]: unknown
  }
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
  error?: string
}
