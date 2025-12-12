-- Create listings table for host properties
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type TEXT NOT NULL,
  country TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  amenities TEXT[] DEFAULT '{}',
  photos JSONB DEFAULT '[]',
  base_price DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  additional_guest_fee DECIMAL(10, 2) DEFAULT 0,
  smart_pricing BOOLEAN DEFAULT false,
  min_stay INTEGER DEFAULT 1,
  max_stay INTEGER DEFAULT 30,
  instant_book BOOLEAN DEFAULT true,
  blocked_dates TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);

-- Create an index on city for location-based searches
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);

-- Enable RLS but allow public access for now (no auth required)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read published listings
CREATE POLICY "Allow public read of published listings"
  ON public.listings
  FOR SELECT
  USING (status = 'published');

-- Policy to allow anyone to insert listings (for demo purposes)
CREATE POLICY "Allow public insert of listings"
  ON public.listings
  FOR INSERT
  WITH CHECK (true);

-- Policy to allow anyone to update their own listings (by id for demo)
CREATE POLICY "Allow public update of listings"
  ON public.listings
  FOR UPDATE
  USING (true);
