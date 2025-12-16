# GetIn Guest Backend - Complete Implementation Guide

## Overview

This document provides comprehensive instructions for implementing the Guest Backend for the GetIn platform. The implementation follows the exact same architecture, patterns, naming conventions, and database conventions used in the existing Host backend.

## Table of Contents

1. [Database Setup](#database-setup)
2. [File Structure](#file-structure)
3. [API Endpoints](#api-endpoints)
4. [Types & Validations](#types--validations)
5. [Payment Integration](#payment-integration)
6. [Environment Variables](#environment-variables)
7. [Frontend Integration](#frontend-integration)

---

## Database Setup

### Step 1: Run the Migration

Execute the migration file to create all necessary tables:

```bash
# In your Supabase dashboard SQL Editor, run:
# scripts/migrations/002_guest_backend_complete.sql
```

### Tables Created

| Table | Description |
|-------|-------------|
| `profiles` (updated) | Added roles, verification fields, preferences |
| `guest_preferences` | Guest travel preferences and requirements |
| `bookings` (updated) | Enhanced with payment fields, pricing breakdown |
| `payments` | Individual payment transactions |
| `payment_methods` | Saved payment methods (MonCash, PayPal, Stripe) |
| `favorites` | User favorite listings |
| `favorite_collections` | Organize favorites into collections |
| `conversations` | Messaging threads between hosts and guests |
| `messages` | Individual messages |
| `reviews` | Multi-category reviews with host responses |
| `review_helpful_votes` | Track helpful votes on reviews |
| `check_ins` | Check-in records with property documentation |
| `check_outs` | Check-out records with condition reports |
| `search_history` | User search history for personalization |
| `listing_views` | Track listing views and analytics |
| `guest_analytics` | Aggregated guest statistics |
| `notifications` | User notifications |
| `promo_codes` | Discount codes |
| `promo_code_usage` | Track promo code usage |
| `verification_requests` | User verification submissions |

### Key RLS Policies

All tables have Row Level Security enabled with appropriate policies:

- Guests can only see/modify their own data
- Hosts can see booking/conversation data for their listings
- Published reviews are publicly visible
- Listings are publicly searchable

---

## File Structure

```
app/
├── api/
│   └── guest/
│       ├── search/route.ts          # Search & discovery
│       ├── listings/
│       │   └── [id]/
│       │       ├── route.ts         # Get listing details
│       │       └── availability/route.ts  # Check availability
│       ├── bookings/
│       │   ├── route.ts             # List/create bookings
│       │   └── [id]/route.ts        # Get/cancel booking
│       ├── payments/route.ts        # Payment methods & processing
│       ├── favorites/route.ts       # Manage favorites
│       ├── messages/route.ts        # Conversations & messages
│       ├── reviews/route.ts         # Guest reviews
│       ├── check-in/route.ts        # Check-in process
│       ├── check-out/route.ts       # Check-out process
│       ├── profile/route.ts         # Guest profile
│       └── notifications/route.ts   # Notifications
│   └── webhooks/
│       ├── moncash/route.ts         # MonCash webhook
│       ├── paypal/route.ts          # PayPal webhook
│       └── stripe/route.ts          # Stripe webhook
├── guest/
│   └── actions.ts                   # Server actions

lib/
├── types/
│   └── guest.ts                     # All guest TypeScript types
└── validations/
    └── guest.ts                     # Zod validation schemas

scripts/migrations/
└── 002_guest_backend_complete.sql   # Database migration
```

---

## API Endpoints

### Search & Discovery

#### `GET /api/guest/search`
Search for listings with filters.

**Query Parameters:**
- `location` - City, state, or country
- `check_in`, `check_out` - Date range
- `num_guests` - Number of guests
- `min_price`, `max_price` - Price range
- `property_types` - Comma-separated types
- `amenities` - Comma-separated amenities
- `instant_book` - Boolean
- `superhost` - Boolean
- `page`, `limit` - Pagination
- `sort` - relevance, price_asc, price_desc, rating, newest

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
}
```

### Listings

#### `GET /api/guest/listings/[id]`
Get detailed listing information.

#### `GET /api/guest/listings/[id]/availability`
Check availability for dates.

**Query Parameters:**
- `check_in` - Check-in date
- `check_out` - Check-out date

### Bookings

#### `GET /api/guest/bookings`
List guest bookings.

**Query Parameters:**
- `status` - Filter by status
- `type` - upcoming, past, all
- `page`, `limit` - Pagination

#### `POST /api/guest/bookings`
Create a new booking.

**Request Body:**
```json
{
  "listing_id": "uuid",
  "check_in": "2024-01-15",
  "check_out": "2024-01-20",
  "num_guests": 2,
  "guest_message": "Looking forward to our stay!",
  "payment_method": "moncash"
}
```

#### `GET /api/guest/bookings/[id]`
Get booking details.

#### `PATCH /api/guest/bookings/[id]`
Cancel a booking.

**Request Body:**
```json
{
  "action": "cancel",
  "reason": "Change of plans"
}
```

### Payments

#### `GET /api/guest/payments`
List saved payment methods.

#### `POST /api/guest/payments`
Add payment method or process payment.

**Add Payment Method:**
```json
{
  "action": "add_method",
  "method_type": "moncash",
  "moncash_phone": "+50937123456",
  "is_default": true
}
```

**Process Payment:**
```json
{
  "action": "process_payment",
  "booking_id": "uuid",
  "payment_method": "moncash",
  "amount": 5000,
  "return_url": "https://..."
}
```

### Favorites

#### `GET /api/guest/favorites`
List favorited listings.

#### `POST /api/guest/favorites`
Add to favorites.

```json
{
  "listing_id": "uuid",
  "collection_name": "Summer Trips"
}
```

#### `DELETE /api/guest/favorites?listing_id=uuid`
Remove from favorites.

### Messages

#### `GET /api/guest/messages`
List conversations.

#### `GET /api/guest/messages?conversation_id=uuid`
Get messages in a conversation.

#### `POST /api/guest/messages`
Send message or start conversation.

**Start Conversation:**
```json
{
  "action": "start",
  "listing_id": "uuid",
  "host_id": "uuid",
  "message": "Hi, I have a question..."
}
```

**Send Message:**
```json
{
  "conversation_id": "uuid",
  "message_text": "Thank you!"
}
```

### Reviews

#### `GET /api/guest/reviews`
List reviews (written and received).

#### `POST /api/guest/reviews`
Create a review.

```json
{
  "booking_id": "uuid",
  "overall_rating": 5,
  "cleanliness_rating": 5,
  "accuracy_rating": 4.5,
  "communication_rating": 5,
  "location_rating": 4,
  "check_in_rating": 5,
  "value_rating": 4.5,
  "review_text": "Amazing stay!"
}
```

### Check-in / Check-out

#### `GET /api/guest/check-in?booking_id=uuid`
Get check-in information.

#### `POST /api/guest/check-in`
Complete check-in.

```json
{
  "action": "complete",
  "booking_id": "uuid",
  "guest_acknowledged_rules": true,
  "property_photos": [...]
}
```

#### `POST /api/guest/check-out`
Complete check-out.

```json
{
  "action": "complete",
  "booking_id": "uuid",
  "property_condition": "excellent",
  "keys_returned": true
}
```

### Profile

#### `GET /api/guest/profile`
Get guest profile and preferences.

#### `PATCH /api/guest/profile`
Update profile or preferences.

```json
{
  "section": "profile",
  "data": {
    "full_name": "Jean Pierre",
    "phone": "+50937123456"
  }
}
```

### Notifications

#### `GET /api/guest/notifications`
List notifications.

#### `PATCH /api/guest/notifications`
Mark notifications as read.

```json
{
  "mark_all": true
}
```

---

## Types & Validations

### TypeScript Types

All types are in `lib/types/guest.ts`:

```typescript
import type {
  Profile,
  GuestBooking,
  GuestBookingWithRelations,
  Payment,
  SavedPaymentMethod,
  Favorite,
  Conversation,
  Message,
  Review,
  CheckIn,
  CheckOut,
  SearchFilters,
  GuestDashboardStats,
  // ... more types
} from "@/lib/types/guest"
```

### Zod Schemas

All validations are in `lib/validations/guest.ts`:

```typescript
import {
  createBookingSchema,
  profileUpdateSchema,
  createReviewSchema,
  sendMessageSchema,
  // ... more schemas
} from "@/lib/validations/guest"
```

---

## Payment Integration

### MonCash

1. Set environment variables:
```env
MONCASH_CLIENT_ID=your_client_id
MONCASH_CLIENT_SECRET=your_client_secret
MONCASH_BUSINESS_KEY=your_business_key
MONCASH_MODE=sandbox # or production
```

2. Configure webhook URL in MonCash dashboard:
```
https://yourdomain.com/api/webhooks/moncash
```

### PayPal

1. Set environment variables:
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox # or live
```

2. Configure webhook URL in PayPal dashboard:
```
https://yourdomain.com/api/webhooks/paypal
```

### Stripe

1. Set environment variables:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

2. Configure webhook URL:
```
https://yourdomain.com/api/webhooks/stripe
```

---

## Environment Variables

Add these to your `.env.local`:

```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MonCash
MONCASH_CLIENT_ID=
MONCASH_CLIENT_SECRET=
MONCASH_BUSINESS_KEY=
MONCASH_MODE=sandbox

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Frontend Integration

### Using Server Actions

```typescript
import {
  getGuestDashboardStats,
  getUpcomingTrips,
  toggleFavorite,
} from "@/app/guest/actions"

// In a Server Component
const { stats } = await getGuestDashboardStats()

// In a Client Component (with useTransition)
const [isPending, startTransition] = useTransition()

const handleFavorite = () => {
  startTransition(async () => {
    await toggleFavorite(listingId)
  })
}
```

### Using API Routes

```typescript
// Search listings
const response = await fetch('/api/guest/search?location=Port-au-Prince&num_guests=2')
const { data } = await response.json()

// Create booking
const response = await fetch('/api/guest/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    listing_id: 'uuid',
    check_in: '2024-01-15',
    check_out: '2024-01-20',
    num_guests: 2,
    payment_method: 'moncash'
  })
})
```

### Using React Hooks

Create custom hooks for common operations:

```typescript
// hooks/use-guest-bookings.ts
'use client'

import { useState, useEffect } from 'react'

export function useGuestBookings(type?: 'upcoming' | 'past') {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/guest/bookings?type=${type || 'all'}`)
      .then(res => res.json())
      .then(data => {
        setBookings(data.data || [])
        setLoading(false)
      })
  }, [type])

  return { bookings, loading }
}
```

---

## Realtime Features

The following tables are enabled for Supabase Realtime:
- `messages` - Real-time messaging
- `conversations` - Conversation updates
- `bookings` - Booking status changes
- `notifications` - Real-time notifications

### Subscribe to Messages

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // Handle new message
      console.log('New message:', payload.new)
    }
  )
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
```

---

## Testing

### Test Search
```bash
curl "http://localhost:3000/api/guest/search?location=Port-au-Prince&num_guests=2"
```

### Test Booking Creation
```bash
curl -X POST "http://localhost:3000/api/guest/bookings" \
  -H "Content-Type: application/json" \
  -d '{"listing_id":"uuid","check_in":"2024-01-15","check_out":"2024-01-20","num_guests":2,"payment_method":"moncash"}'
```

---

## Summary

This implementation provides a complete Guest Backend with:

✅ Unified user system with roles (guest/host)
✅ Property search & discovery
✅ Booking system with instant book support
✅ Multi-provider payments (MonCash, PayPal, Stripe)
✅ Favorites/wishlist management
✅ Real-time messaging
✅ Multi-category reviews
✅ Check-in/check-out system
✅ Guest profile & verification
✅ Notifications
✅ Promo codes
✅ Analytics & history

All code follows the existing patterns in the Host backend for consistency and maintainability.
