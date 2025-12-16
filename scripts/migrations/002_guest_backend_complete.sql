-- =====================================================
-- GETIN GUEST BACKEND - COMPLETE DATABASE MIGRATION
-- =====================================================
-- This migration creates all tables needed for the guest
-- backend including: unified user system, bookings, payments,
-- messaging, reviews, check-in/out, and favorites
-- =====================================================

-- =====================================================
-- PART 1: UNIFIED USER SYSTEM WITH ROLES
-- =====================================================

-- Add roles column to profiles table (default is guest)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['guest']::TEXT[];

-- Add additional profile fields for guests
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS id_document_url TEXT,
ADD COLUMN IF NOT EXISTS id_document_type TEXT CHECK (id_document_type IN ('passport', 'national_id', 'drivers_license')),
ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'HTG',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::JSONB,
ADD COLUMN IF NOT EXISTS emergency_contact JSONB,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS work TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Create index on roles for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN (roles);

-- Function to add host role when user becomes a host
CREATE OR REPLACE FUNCTION add_host_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET roles = array_append(roles, 'host')
  WHERE id = NEW.user_id
  AND NOT ('host' = ANY(roles));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add host role
DROP TRIGGER IF EXISTS on_host_created ON public.hosts;
CREATE TRIGGER on_host_created
  AFTER INSERT ON public.hosts
  FOR EACH ROW
  EXECUTE FUNCTION add_host_role();

-- =====================================================
-- PART 2: GUEST-SPECIFIC TABLES
-- =====================================================

-- Guest Preferences Table
CREATE TABLE IF NOT EXISTS public.guest_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_property_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_locations TEXT[] DEFAULT ARRAY[]::TEXT[],
  price_range_min DECIMAL(10, 2),
  price_range_max DECIMAL(10, 2),
  preferred_check_in_time TIME,
  preferred_check_out_time TIME,
  accessibility_needs TEXT[] DEFAULT ARRAY[]::TEXT[],
  dietary_requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
  travel_style TEXT CHECK (travel_style IN ('business', 'leisure', 'family', 'adventure', 'luxury', 'budget')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- PART 3: ENHANCED BOOKINGS TABLE
-- =====================================================

-- First, ensure the bookings table has all needed columns
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_reference TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS nights INTEGER,
ADD COLUMN IF NOT EXISTS base_price_per_night DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total_nights_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS host_payout DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'HTG',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'partially_refunded', 'refunded', 'failed')),
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('moncash', 'paypal', 'stripe', 'bank_transfer', 'cash')),
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider_reference TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS refund_status TEXT CHECK (refund_status IN ('none', 'requested', 'processing', 'completed', 'denied')),
ADD COLUMN IF NOT EXISTS guest_message TEXT,
ADD COLUMN IF NOT EXISTS host_message TEXT,
ADD COLUMN IF NOT EXISTS check_in_time TIME,
ADD COLUMN IF NOT EXISTS check_out_time TIME,
ADD COLUMN IF NOT EXISTS is_instant_book BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS num_adults INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS num_children INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_infants INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS num_pets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS promo_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'accepted', 'confirmed', 'declined', 'cancelled', 'cancelled_by_guest', 'cancelled_by_host', 'completed', 'no_show'));

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := 'GI' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for booking reference
DROP TRIGGER IF EXISTS set_booking_reference ON public.bookings;
CREATE TRIGGER set_booking_reference
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_reference();

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON public.bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON public.bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);

-- =====================================================
-- PART 4: PAYMENTS & TRANSACTIONS
-- =====================================================

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'HTG',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('moncash', 'paypal', 'stripe', 'bank_transfer', 'cash')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('booking', 'deposit', 'balance', 'refund', 'damage', 'extra_service')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  provider_payment_id TEXT,
  provider_transaction_id TEXT,
  provider_reference TEXT,
  provider_response JSONB,
  fee_amount DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}'::JSONB,
  error_message TEXT,
  error_code TEXT,
  ip_address INET,
  user_agent TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Methods (saved payment methods)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('moncash', 'paypal', 'stripe_card', 'bank_account')),
  is_default BOOLEAN DEFAULT false,
  nickname TEXT,
  -- MonCash specific
  moncash_phone TEXT,
  -- PayPal specific
  paypal_email TEXT,
  paypal_payer_id TEXT,
  -- Stripe specific
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  card_last_four TEXT,
  card_brand TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  -- Bank specific
  bank_name TEXT,
  bank_account_last_four TEXT,
  -- Common fields
  billing_address JSONB,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);

-- =====================================================
-- PART 5: FAVORITES / WISHLIST
-- =====================================================

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  collection_name TEXT DEFAULT 'Favorites',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Favorite Collections
CREATE TABLE IF NOT EXISTS public.favorite_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites(listing_id);

-- =====================================================
-- PART 6: ENHANCED MESSAGING SYSTEM
-- =====================================================

-- Update conversations table if it exists, or create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversations') THEN
    CREATE TABLE public.conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
      booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
      host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
      guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
      last_message_at TIMESTAMP WITH TIME ZONE,
      last_message_preview TEXT,
      host_unread_count INTEGER DEFAULT 0,
      guest_unread_count INTEGER DEFAULT 0,
      host_archived BOOLEAN DEFAULT false,
      guest_archived BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add any missing columns to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'inquiry' CHECK (conversation_type IN ('inquiry', 'booking', 'support', 'review'));

-- Update messages table if it exists, or create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') THEN
    CREATE TABLE public.messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      message_text TEXT NOT NULL,
      message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'booking_request', 'booking_confirmation')),
      attachments JSONB DEFAULT '[]'::JSONB,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMP WITH TIME ZONE,
      is_deleted_by_sender BOOLEAN DEFAULT false,
      is_deleted_by_recipient BOOLEAN DEFAULT false,
      metadata JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Create indexes for messaging
CREATE INDEX IF NOT EXISTS idx_conversations_host_id ON public.conversations(host_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guest_id ON public.conversations(guest_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- =====================================================
-- PART 7: ENHANCED REVIEWS SYSTEM
-- =====================================================

-- Update reviews table or create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'reviews') THEN
    CREATE TABLE public.reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
      listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
      host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
      reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      review_type TEXT NOT NULL CHECK (review_type IN ('guest_to_host', 'host_to_guest')),
      overall_rating DECIMAL(2, 1) NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
      cleanliness_rating DECIMAL(2, 1) CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
      accuracy_rating DECIMAL(2, 1) CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
      communication_rating DECIMAL(2, 1) CHECK (communication_rating >= 1 AND communication_rating <= 5),
      location_rating DECIMAL(2, 1) CHECK (location_rating >= 1 AND location_rating <= 5),
      check_in_rating DECIMAL(2, 1) CHECK (check_in_rating >= 1 AND check_in_rating <= 5),
      value_rating DECIMAL(2, 1) CHECK (value_rating >= 1 AND value_rating <= 5),
      review_text TEXT,
      private_feedback TEXT,
      host_response TEXT,
      host_response_at TIMESTAMP WITH TIME ZONE,
      photos JSONB DEFAULT '[]'::JSONB,
      status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'hidden', 'flagged', 'removed')),
      is_featured BOOLEAN DEFAULT false,
      helpful_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(booking_id, review_type)
    );
  END IF;
END $$;

-- Add missing columns to reviews
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS cleanliness_rating DECIMAL(2, 1) CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
ADD COLUMN IF NOT EXISTS accuracy_rating DECIMAL(2, 1) CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
ADD COLUMN IF NOT EXISTS communication_rating DECIMAL(2, 1) CHECK (communication_rating >= 1 AND communication_rating <= 5),
ADD COLUMN IF NOT EXISTS location_rating DECIMAL(2, 1) CHECK (location_rating >= 1 AND location_rating <= 5),
ADD COLUMN IF NOT EXISTS check_in_rating DECIMAL(2, 1) CHECK (check_in_rating >= 1 AND check_in_rating <= 5),
ADD COLUMN IF NOT EXISTS value_rating DECIMAL(2, 1) CHECK (value_rating >= 1 AND value_rating <= 5),
ADD COLUMN IF NOT EXISTS private_feedback TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;

-- Review Helpful Votes
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- =====================================================
-- PART 8: CHECK-IN / CHECK-OUT SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('self', 'host_assisted', 'keybox', 'smart_lock', 'concierge')),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'in_progress', 'completed', 'missed', 'cancelled')),
  access_code TEXT,
  access_code_expires_at TIMESTAMP WITH TIME ZONE,
  access_instructions TEXT,
  property_condition_notes TEXT,
  property_photos JSONB DEFAULT '[]'::JSONB,
  guest_verification_photo TEXT,
  guest_signature TEXT,
  id_verified BOOLEAN DEFAULT false,
  special_requests_fulfilled TEXT,
  host_notes TEXT,
  issues_reported TEXT,
  guest_acknowledged_rules BOOLEAN DEFAULT false,
  wifi_credentials JSONB,
  emergency_contacts JSONB,
  local_recommendations JSONB,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE TABLE IF NOT EXISTS public.check_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'late', 'extended')),
  checkout_instructions TEXT,
  property_condition TEXT CHECK (property_condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  property_photos JSONB DEFAULT '[]'::JSONB,
  items_left_behind TEXT,
  damage_reported TEXT,
  damage_photos JSONB DEFAULT '[]'::JSONB,
  damage_amount DECIMAL(10, 2),
  cleaning_status TEXT CHECK (cleaning_status IN ('clean', 'needs_attention', 'requires_deep_clean')),
  host_notes TEXT,
  guest_feedback TEXT,
  keys_returned BOOLEAN DEFAULT true,
  late_checkout_fee DECIMAL(10, 2) DEFAULT 0,
  late_checkout_approved BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_check_ins_booking_id ON public.check_ins(booking_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_guest_id ON public.check_ins(guest_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON public.check_ins(status);
CREATE INDEX IF NOT EXISTS idx_check_outs_booking_id ON public.check_outs(booking_id);
CREATE INDEX IF NOT EXISTS idx_check_outs_guest_id ON public.check_outs(guest_id);

-- =====================================================
-- PART 9: SEARCH HISTORY & ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  search_query TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  check_in DATE,
  check_out DATE,
  num_guests INTEGER,
  filters JSONB DEFAULT '{}'::JSONB,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.listing_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  view_duration_seconds INTEGER,
  source TEXT CHECK (source IN ('search', 'direct', 'favorites', 'recommendation', 'share', 'map')),
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guest_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bookings INTEGER DEFAULT 0,
  total_nights_stayed INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  average_booking_value DECIMAL(10, 2) DEFAULT 0,
  favorite_location TEXT,
  favorite_property_type TEXT,
  last_booking_at TIMESTAMP WITH TIME ZONE,
  member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON public.listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_user_id ON public.listing_views(user_id);

-- =====================================================
-- PART 10: NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'booking_request', 'booking_confirmed', 'booking_declined', 'booking_cancelled',
    'payment_received', 'payment_failed', 'refund_processed',
    'message_received', 'review_received', 'review_reminder',
    'check_in_reminder', 'check_out_reminder',
    'listing_favorited', 'price_drop', 'special_offer',
    'account_verified', 'system_announcement'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::JSONB,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_push_sent BOOLEAN DEFAULT false,
  is_email_sent BOOLEAN DEFAULT false,
  is_sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =====================================================
-- PART 11: PROMO CODES & DISCOUNTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_booking_amount DECIMAL(10, 2),
  max_discount_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'HTG',
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  applicable_listings UUID[] DEFAULT ARRAY[]::UUID[],
  applicable_property_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  first_booking_only BOOLEAN DEFAULT false,
  new_users_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  discount_applied DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(promo_code_id, booking_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);

-- =====================================================
-- PART 12: VERIFICATION REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'phone', 'id_document', 'address', 'selfie')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'expired')),
  document_url TEXT,
  document_type TEXT,
  submitted_data JSONB DEFAULT '{}'::JSONB,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

-- =====================================================
-- PART 13: UPDATE FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update listing stats after booking
CREATE OR REPLACE FUNCTION update_listing_booking_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update bookings count
  UPDATE public.listings
  SET 
    bookings_count = (
      SELECT COUNT(*) FROM public.bookings 
      WHERE listing_id = NEW.listing_id 
      AND status IN ('accepted', 'confirmed', 'completed')
    ),
    updated_at = NOW()
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_stats_update ON public.bookings;
CREATE TRIGGER on_booking_stats_update
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_booking_stats();

-- Function to update listing review stats
CREATE OR REPLACE FUNCTION update_listing_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listings
  SET 
    reviews_count = (
      SELECT COUNT(*) FROM public.reviews 
      WHERE listing_id = NEW.listing_id 
      AND review_type = 'guest_to_host'
      AND status = 'published'
    ),
    average_rating = (
      SELECT COALESCE(AVG(overall_rating), 0) FROM public.reviews 
      WHERE listing_id = NEW.listing_id 
      AND review_type = 'guest_to_host'
      AND status = 'published'
    ),
    updated_at = NOW()
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_stats_update ON public.reviews;
CREATE TRIGGER on_review_stats_update
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_review_stats();

-- Function to update favorites count
CREATE OR REPLACE FUNCTION update_listing_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.listings
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.listings
    SET favorites_count = GREATEST(0, favorites_count - 1)
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_favorite_change ON public.favorites;
CREATE TRIGGER on_favorite_change
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_favorites_count();

-- Function to update guest analytics
CREATE OR REPLACE FUNCTION update_guest_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.guest_analytics (user_id)
  VALUES (NEW.guest_id)
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_bookings = (
      SELECT COUNT(*) FROM public.bookings 
      WHERE guest_id = NEW.guest_id 
      AND status IN ('completed')
    ),
    total_nights_stayed = COALESCE((
      SELECT SUM(nights) FROM public.bookings 
      WHERE guest_id = NEW.guest_id 
      AND status = 'completed'
    ), 0),
    total_spent = COALESCE((
      SELECT SUM(total_amount) FROM public.bookings 
      WHERE guest_id = NEW.guest_id 
      AND status = 'completed'
      AND payment_status = 'captured'
    ), 0),
    last_booking_at = NEW.created_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_analytics_update ON public.bookings;
CREATE TRIGGER on_booking_analytics_update
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.guest_id IS NOT NULL)
  EXECUTE FUNCTION update_guest_analytics();

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion INTEGER := 0;
  total_fields INTEGER := 10;
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN completion := completion + 1; END IF;
  IF NEW.avatar_url IS NOT NULL THEN completion := completion + 1; END IF;
  IF NEW.phone IS NOT NULL THEN completion := completion + 1; END IF;
  IF NEW.phone_verified THEN completion := completion + 1; END IF;
  IF NEW.email_verified THEN completion := completion + 1; END IF;
  IF NEW.id_verified THEN completion := completion + 1; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN completion := completion + 1; END IF;
  IF NEW.city IS NOT NULL THEN completion := completion + 1; END IF;
  IF NEW.country IS NOT NULL THEN completion := completion + 1; END IF;
  IF array_length(NEW.languages, 1) > 0 THEN completion := completion + 1; END IF;
  
  NEW.profile_completion_percentage := (completion * 100) / total_fields;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_profile_completion_trigger ON public.profiles;
CREATE TRIGGER calculate_profile_completion_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_completion();

-- =====================================================
-- PART 14: RLS POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.guest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);

-- Guest Preferences Policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.guest_preferences;
CREATE POLICY "Users can manage own preferences" ON public.guest_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Bookings Policies for Guests
DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
CREATE POLICY "Guests can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = guest_id OR auth.uid() IN (
    SELECT user_id FROM public.hosts WHERE id = host_id
  ));

DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;
CREATE POLICY "Guests can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Guests can update own pending bookings" ON public.bookings;
CREATE POLICY "Guests can update own pending bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = guest_id AND status IN ('pending', 'accepted')
  );

-- Payments Policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment Methods Policies
DROP POLICY IF EXISTS "Users can manage own payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Favorites Policies
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Favorite Collections Policies
DROP POLICY IF EXISTS "Users can manage own collections" ON public.favorite_collections;
CREATE POLICY "Users can manage own collections" ON public.favorite_collections
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public collections are viewable" ON public.favorite_collections;
CREATE POLICY "Public collections are viewable" ON public.favorite_collections
  FOR SELECT USING (is_public = true);

-- Conversations Policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    auth.uid() = guest_id OR 
    auth.uid() IN (SELECT user_id FROM public.hosts WHERE id = host_id)
  );

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (
    auth.uid() = guest_id OR 
    auth.uid() IN (SELECT user_id FROM public.hosts WHERE id = host_id)
  );

-- Messages Policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Reviews Policies
DROP POLICY IF EXISTS "Published reviews are public" ON public.reviews;
CREATE POLICY "Published reviews are public" ON public.reviews
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
CREATE POLICY "Users can view own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.reviews;
CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND (guest_id = auth.uid() OR host_id IN (
        SELECT id FROM public.hosts WHERE user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- Review Helpful Votes Policies
DROP POLICY IF EXISTS "Users can manage own votes" ON public.review_helpful_votes;
CREATE POLICY "Users can manage own votes" ON public.review_helpful_votes
  FOR ALL USING (auth.uid() = user_id);

-- Check-ins Policies
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.check_ins;
CREATE POLICY "Users can view own check-ins" ON public.check_ins
  FOR SELECT USING (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Check-in creation" ON public.check_ins;
CREATE POLICY "Check-in creation" ON public.check_ins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND guest_id = auth.uid())
  );

DROP POLICY IF EXISTS "Check-in update" ON public.check_ins;
CREATE POLICY "Check-in update" ON public.check_ins
  FOR UPDATE USING (auth.uid() = guest_id);

-- Check-outs Policies
DROP POLICY IF EXISTS "Users can view own check-outs" ON public.check_outs;
CREATE POLICY "Users can view own check-outs" ON public.check_outs
  FOR SELECT USING (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Check-out creation" ON public.check_outs;
CREATE POLICY "Check-out creation" ON public.check_outs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND guest_id = auth.uid())
  );

DROP POLICY IF EXISTS "Check-out update" ON public.check_outs;
CREATE POLICY "Check-out update" ON public.check_outs
  FOR UPDATE USING (auth.uid() = guest_id);

-- Search History Policies
DROP POLICY IF EXISTS "Users can manage own search history" ON public.search_history;
CREATE POLICY "Users can manage own search history" ON public.search_history
  FOR ALL USING (auth.uid() = user_id);

-- Listing Views Policies
DROP POLICY IF EXISTS "Anyone can insert views" ON public.listing_views;
CREATE POLICY "Anyone can insert views" ON public.listing_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own history" ON public.listing_views;
CREATE POLICY "Users can view own history" ON public.listing_views
  FOR SELECT USING (auth.uid() = user_id);

-- Guest Analytics Policies
DROP POLICY IF EXISTS "Users can view own analytics" ON public.guest_analytics;
CREATE POLICY "Users can view own analytics" ON public.guest_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Promo Codes Policies
DROP POLICY IF EXISTS "Active promo codes are viewable" ON public.promo_codes;
CREATE POLICY "Active promo codes are viewable" ON public.promo_codes
  FOR SELECT USING (is_active = true AND valid_until > NOW());

-- Promo Code Usage Policies
DROP POLICY IF EXISTS "Users can view own promo usage" ON public.promo_code_usage;
CREATE POLICY "Users can view own promo usage" ON public.promo_code_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record promo usage" ON public.promo_code_usage;
CREATE POLICY "Users can record promo usage" ON public.promo_code_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verification Requests Policies
DROP POLICY IF EXISTS "Users can manage own verifications" ON public.verification_requests;
CREATE POLICY "Users can manage own verifications" ON public.verification_requests
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- PART 15: HELPER FUNCTIONS
-- =====================================================

-- Function to check listing availability
CREATE OR REPLACE FUNCTION check_listing_availability(
  p_listing_id UUID,
  p_check_in DATE,
  p_check_out DATE
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_available BOOLEAN := true;
  v_blocked_dates TEXT[];
  v_blocked_date DATE;
BEGIN
  -- Check blocked dates
  SELECT blocked_dates INTO v_blocked_dates
  FROM public.listings WHERE id = p_listing_id;
  
  IF v_blocked_dates IS NOT NULL THEN
    FOREACH v_blocked_date IN ARRAY (
      SELECT ARRAY(SELECT unnest(v_blocked_dates)::DATE)
    ) LOOP
      IF v_blocked_date >= p_check_in AND v_blocked_date < p_check_out THEN
        RETURN false;
      END IF;
    END LOOP;
  END IF;
  
  -- Check existing bookings
  SELECT NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE listing_id = p_listing_id
    AND status IN ('pending', 'accepted', 'confirmed')
    AND (
      (check_in::DATE <= p_check_in AND check_out::DATE > p_check_in) OR
      (check_in::DATE < p_check_out AND check_out::DATE >= p_check_out) OR
      (check_in::DATE >= p_check_in AND check_out::DATE <= p_check_out)
    )
  ) INTO v_is_available;
  
  RETURN v_is_available;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate booking price
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_listing_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_num_guests INTEGER DEFAULT 1,
  p_promo_code TEXT DEFAULT NULL
) RETURNS TABLE (
  nights INTEGER,
  base_price_per_night DECIMAL,
  total_nights_cost DECIMAL,
  cleaning_fee DECIMAL,
  service_fee DECIMAL,
  tax_amount DECIMAL,
  discount_amount DECIMAL,
  total_amount DECIMAL,
  host_payout DECIMAL
) AS $$
DECLARE
  v_listing RECORD;
  v_nights INTEGER;
  v_base_price DECIMAL;
  v_cleaning DECIMAL;
  v_service DECIMAL;
  v_tax DECIMAL;
  v_discount DECIMAL := 0;
  v_total DECIMAL;
  v_payout DECIMAL;
  v_promo RECORD;
BEGIN
  -- Get listing details
  SELECT l.base_price, l.cleaning_fee, l.additional_guest_fee, l.max_guests
  INTO v_listing
  FROM public.listings l WHERE l.id = p_listing_id;
  
  -- Calculate nights
  v_nights := p_check_out - p_check_in;
  
  -- Calculate base price (with additional guest fee if applicable)
  v_base_price := v_listing.base_price;
  IF p_num_guests > 1 AND v_listing.additional_guest_fee > 0 THEN
    v_base_price := v_base_price + (v_listing.additional_guest_fee * (p_num_guests - 1));
  END IF;
  
  -- Total nights cost
  base_price_per_night := v_base_price;
  total_nights_cost := v_base_price * v_nights;
  
  -- Cleaning fee
  cleaning_fee := COALESCE(v_listing.cleaning_fee, 0);
  
  -- Service fee (10% of subtotal)
  v_service := (total_nights_cost + cleaning_fee) * 0.10;
  service_fee := ROUND(v_service, 2);
  
  -- Tax (10% of subtotal)
  v_tax := (total_nights_cost + cleaning_fee) * 0.10;
  tax_amount := ROUND(v_tax, 2);
  
  -- Check promo code
  IF p_promo_code IS NOT NULL THEN
    SELECT * INTO v_promo FROM public.promo_codes
    WHERE code = UPPER(p_promo_code)
    AND is_active = true
    AND valid_from <= NOW()
    AND valid_until >= NOW()
    AND (usage_limit IS NULL OR usage_count < usage_limit);
    
    IF v_promo IS NOT NULL THEN
      IF v_promo.discount_type = 'percentage' THEN
        v_discount := (total_nights_cost * v_promo.discount_value / 100);
      ELSE
        v_discount := v_promo.discount_value;
      END IF;
      
      IF v_promo.max_discount_amount IS NOT NULL AND v_discount > v_promo.max_discount_amount THEN
        v_discount := v_promo.max_discount_amount;
      END IF;
    END IF;
  END IF;
  discount_amount := ROUND(v_discount, 2);
  
  -- Total amount
  v_total := total_nights_cost + cleaning_fee + service_fee + tax_amount - discount_amount;
  total_amount := ROUND(v_total, 2);
  
  -- Host payout (total - service fee - platform commission 3%)
  v_payout := total_nights_cost + cleaning_fee - (total_nights_cost * 0.03);
  host_payout := ROUND(v_payout, 2);
  
  nights := v_nights;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_listing_id UUID DEFAULT NULL,
  p_booking_amount DECIMAL DEFAULT NULL
) RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  discount_type TEXT,
  discount_value DECIMAL,
  max_discount DECIMAL
) AS $$
DECLARE
  v_promo RECORD;
  v_usage_count INTEGER;
BEGIN
  is_valid := false;
  error_message := NULL;
  
  -- Get promo code
  SELECT * INTO v_promo FROM public.promo_codes
  WHERE code = UPPER(p_code);
  
  IF v_promo IS NULL THEN
    error_message := 'Code promo invalide';
    RETURN NEXT;
    RETURN;
  END IF;
  
  IF NOT v_promo.is_active THEN
    error_message := 'Ce code promo n''est plus actif';
    RETURN NEXT;
    RETURN;
  END IF;
  
  IF v_promo.valid_from > NOW() THEN
    error_message := 'Ce code promo n''est pas encore valide';
    RETURN NEXT;
    RETURN;
  END IF;
  
  IF v_promo.valid_until < NOW() THEN
    error_message := 'Ce code promo a expiré';
    RETURN NEXT;
    RETURN;
  END IF;
  
  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    error_message := 'Ce code promo a atteint sa limite d''utilisation';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check per-user limit
  SELECT COUNT(*) INTO v_usage_count
  FROM public.promo_code_usage
  WHERE promo_code_id = v_promo.id AND user_id = p_user_id;
  
  IF v_usage_count >= v_promo.per_user_limit THEN
    error_message := 'Vous avez déjà utilisé ce code promo';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check minimum booking amount
  IF v_promo.min_booking_amount IS NOT NULL AND p_booking_amount IS NOT NULL 
     AND p_booking_amount < v_promo.min_booking_amount THEN
    error_message := 'Le montant minimum de réservation n''est pas atteint';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check first booking only
  IF v_promo.first_booking_only THEN
    IF EXISTS (SELECT 1 FROM public.bookings WHERE guest_id = p_user_id AND status = 'completed') THEN
      error_message := 'Ce code est réservé aux nouvelles réservations';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Check applicable listings
  IF array_length(v_promo.applicable_listings, 1) > 0 AND p_listing_id IS NOT NULL THEN
    IF NOT p_listing_id = ANY(v_promo.applicable_listings) THEN
      error_message := 'Ce code n''est pas valide pour ce logement';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;
  
  is_valid := true;
  discount_type := v_promo.discount_type;
  discount_value := v_promo.discount_value;
  max_discount := v_promo.max_discount_amount;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment function for counters
CREATE OR REPLACE FUNCTION increment(x INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 16: REALTIME SUBSCRIPTIONS
-- =====================================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =====================================================
-- COMPLETE!
-- =====================================================
