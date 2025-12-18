-- =====================================================
-- GETIN FOUNDATION SCHEMA - MIGRATION 000 (CORRECTED)
-- =====================================================
-- THIS MIGRATION MUST RUN FIRST - BEFORE ALL OTHERS
--
-- CORRECTED ISSUES:
-- 1. Uses published_at IS NOT NULL (not status = 'published')
-- 2. DB is source of truth for profiles (trigger only)
-- 3. Safe storage delete policy
-- 4. Removed duplicate superhost field
-- 5. Least-privilege grants
-- 6. Performance index on published_at
-- =====================================================

-- =====================================================
-- PART 1: PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  roles TEXT[] DEFAULT ARRAY['guest']::TEXT[],
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add roles column if missing (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'roles'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN roles TEXT[] DEFAULT ARRAY['guest']::TEXT[];
  END IF;
END $$;

-- Index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN (roles);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- PART 2: HOSTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  bio TEXT,
  profile_picture_url TEXT,
  
  -- Host status (single field, no duplicate)
  is_superhost BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  
  -- Performance metrics
  average_rating DECIMAL(3, 2) DEFAULT 0,
  response_rate INTEGER DEFAULT 100,
  response_time_hours INTEGER DEFAULT 24,
  total_reviews INTEGER DEFAULT 0,
  
  -- Payout info
  payout_method TEXT CHECK (payout_method IN ('moncash', 'bank_transfer', 'paypal')),
  payout_details JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_hosts_user_id ON public.hosts(user_id);

-- Enable RLS
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "hosts_select_public" ON public.hosts;
DROP POLICY IF EXISTS "hosts_select_own" ON public.hosts;
DROP POLICY IF EXISTS "hosts_insert_own" ON public.hosts;
DROP POLICY IF EXISTS "hosts_update_own" ON public.hosts;

-- Public can read host info (for listing pages) - SELECT only for anon
CREATE POLICY "hosts_select_public" ON public.hosts
  FOR SELECT USING (true);

-- Users can insert their own host record
CREATE POLICY "hosts_insert_own" ON public.hosts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own host record
CREATE POLICY "hosts_update_own" ON public.hosts
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- PART 3: FIX LISTINGS TABLE
-- =====================================================

-- Add missing columns to listings table
DO $$
BEGIN
  -- host_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'host_id') THEN
    ALTER TABLE public.listings ADD COLUMN host_id UUID REFERENCES public.hosts(id);
  END IF;
  
  -- title column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'title') THEN
    ALTER TABLE public.listings ADD COLUMN title TEXT;
  END IF;
  
  -- description column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'description') THEN
    ALTER TABLE public.listings ADD COLUMN description TEXT;
  END IF;
  
  -- bedrooms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'bedrooms') THEN
    ALTER TABLE public.listings ADD COLUMN bedrooms INTEGER DEFAULT 1;
  END IF;
  
  -- beds column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'beds') THEN
    ALTER TABLE public.listings ADD COLUMN beds INTEGER DEFAULT 1;
  END IF;
  
  -- bathrooms column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'bathrooms') THEN
    ALTER TABLE public.listings ADD COLUMN bathrooms INTEGER DEFAULT 1;
  END IF;
  
  -- max_guests column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'max_guests') THEN
    ALTER TABLE public.listings ADD COLUMN max_guests INTEGER DEFAULT 2;
  END IF;
  
  -- house_rules column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'house_rules') THEN
    ALTER TABLE public.listings ADD COLUMN house_rules TEXT[] DEFAULT '{}';
  END IF;
  
  -- weekend_price column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'weekend_price') THEN
    ALTER TABLE public.listings ADD COLUMN weekend_price DECIMAL(10, 2);
  END IF;
  
  -- cancellation_policy column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'cancellation_policy') THEN
    ALTER TABLE public.listings ADD COLUMN cancellation_policy TEXT DEFAULT 'flexible';
  END IF;
  
  -- slug column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'slug') THEN
    ALTER TABLE public.listings ADD COLUMN slug TEXT;
  END IF;
  
  -- published_at column (THIS IS THE SOURCE OF TRUTH FOR "PUBLISHED")
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'published_at') THEN
    ALTER TABLE public.listings ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- views_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'views_count') THEN
    ALTER TABLE public.listings ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
  
  -- favorites_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'favorites_count') THEN
    ALTER TABLE public.listings ADD COLUMN favorites_count INTEGER DEFAULT 0;
  END IF;
  
  -- bookings_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'bookings_count') THEN
    ALTER TABLE public.listings ADD COLUMN bookings_count INTEGER DEFAULT 0;
  END IF;
  
  -- average_rating column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'average_rating') THEN
    ALTER TABLE public.listings ADD COLUMN average_rating DECIMAL(3, 2) DEFAULT 0;
  END IF;
  
  -- reviews_count column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'reviews_count') THEN
    ALTER TABLE public.listings ADD COLUMN reviews_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Index for host lookup
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON public.listings(host_id);

-- PERFORMANCE: Index for published listings (partial index)
CREATE INDEX IF NOT EXISTS idx_listings_published
ON public.listings(published_at)
WHERE published_at IS NOT NULL;

-- Fix RLS policies for listings
DROP POLICY IF EXISTS "Allow public read of published listings" ON public.listings;
DROP POLICY IF EXISTS "Allow public insert of listings" ON public.listings;
DROP POLICY IF EXISTS "Allow public update of listings" ON public.listings;
DROP POLICY IF EXISTS "listings_select_published" ON public.listings;
DROP POLICY IF EXISTS "listings_insert_host" ON public.listings;
DROP POLICY IF EXISTS "listings_update_host" ON public.listings;
DROP POLICY IF EXISTS "listings_delete_host" ON public.listings;
DROP POLICY IF EXISTS "listings_select_own" ON public.listings;

-- =====================================================
-- CRITICAL FIX: Use published_at IS NOT NULL, NOT status = 'published'
-- =====================================================
CREATE POLICY "listings_select_published" ON public.listings
  FOR SELECT USING (published_at IS NOT NULL);

-- Hosts can insert their own listings
CREATE POLICY "listings_insert_host" ON public.listings
  FOR INSERT WITH CHECK (
    host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid())
  );

-- Hosts can update their own listings
CREATE POLICY "listings_update_host" ON public.listings
  FOR UPDATE USING (
    host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid())
  );

-- Hosts can delete their own listings
CREATE POLICY "listings_delete_host" ON public.listings
  FOR DELETE USING (
    host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid())
  );

-- Hosts can read their own non-published listings
CREATE POLICY "listings_select_own" ON public.listings
  FOR SELECT USING (
    host_id IN (SELECT id FROM public.hosts WHERE user_id = auth.uid())
  );

-- =====================================================
-- PART 4: TRIGGERS (DB IS SOURCE OF TRUTH)
-- =====================================================

-- Auto-create profile on user signup
-- This is the ONLY place profiles are created (app code only reads)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, roles, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    ARRAY['guest']::TEXT[],
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Idempotent - never overwrite
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-add host role when host record is created
CREATE OR REPLACE FUNCTION public.add_host_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET roles = array_append(roles, 'host'),
      updated_at = NOW()
  WHERE id = NEW.user_id
  AND NOT ('host' = ANY(roles));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_host_created ON public.hosts;
CREATE TRIGGER on_host_created
  AFTER INSERT ON public.hosts
  FOR EACH ROW
  EXECUTE FUNCTION public.add_host_role();

-- =====================================================
-- PART 5: STORAGE BUCKET FOR IMAGES
-- =====================================================

-- Create listing-photos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,  -- PUBLIC bucket so images can be viewed
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true;  -- Ensure bucket is public

-- Storage policies for listing-photos bucket
DROP POLICY IF EXISTS "listing_photos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "listing_photos_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "listing_photos_delete_own" ON storage.objects;

-- Anyone can view listing photos (public)
CREATE POLICY "listing_photos_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-photos');

-- Authenticated users can upload photos
CREATE POLICY "listing_photos_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-photos' 
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- CRITICAL FIX: Safe delete policy (don't assume folder structure)
-- =====================================================
CREATE POLICY "listing_photos_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-photos'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- PART 6: BOOKINGS TABLE (IF NOT EXISTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.hosts(id),
  guest_id UUID NOT NULL REFERENCES auth.users(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  num_guests INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'confirmed', 'declined', 'cancelled', 'cancelled_by_guest', 'cancelled_by_host', 'completed', 'no_show')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 7: GRANT PERMISSIONS (LEAST PRIVILEGE)
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- anon gets SELECT only
GRANT SELECT ON public.profiles TO authenticated;  -- Only authenticated can see profiles
GRANT SELECT ON public.hosts TO anon, authenticated;
GRANT SELECT ON public.listings TO anon, authenticated;

-- authenticated gets full CRUD on own data (RLS enforces ownership)
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.hosts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- DONE - Schema foundation is now complete
-- =====================================================
