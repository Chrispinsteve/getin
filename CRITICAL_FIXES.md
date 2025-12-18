[CRITICAL_FIXES.md](https://github.com/user-attachments/files/24244272/CRITICAL_FIXES.md)
# GetIn - Critical Fixes Documentation (CORRECTED)

## 🎯 DESIGN DECISIONS

### 1. Publishing Model: `published_at IS NOT NULL`
- Listings are "published" when `published_at` has a timestamp
- RLS policy: `SELECT USING (published_at IS NOT NULL)`
- Frontend query: `.not("published_at", "is", null)`
- This is Airbnb-style publishing (timestamp-based, not enum)

### 2. Profile Ownership: Database is Source of Truth
- Profiles are created ONLY by the database trigger
- App code ONLY reads profiles, never inserts
- Eliminates race conditions between trigger and app code

### 3. Storage Permissions: Safe Delete Policy
- Anyone authenticated can delete from `listing-photos` bucket
- No folder structure assumptions
- Tighten later when folder conventions are stable

---

## 📦 FILES IN THIS FIX

### 1. `scripts/migrations/000_foundation_schema.sql`
**RUN THIS FIRST** - Creates all missing tables and policies:

- ✅ Creates `hosts` table (was completely missing)
- ✅ Adds missing columns to `listings` table
- ✅ RLS policy: `published_at IS NOT NULL` (not `status = 'published'`)
- ✅ Performance index on `published_at`
- ✅ Profile trigger with `ON CONFLICT DO NOTHING` (idempotent)
- ✅ Host role trigger (auto-adds 'host' role on host creation)
- ✅ Safe storage delete policy
- ✅ Least-privilege grants (SELECT only for anon)

### 2. `app/(auth)/actions.ts`
Fixed auth actions:

- ✅ Profile creation removed (DB trigger is source of truth)
- ✅ `signIn` only reads profile, never writes
- ✅ `signUp` lets trigger create profile
- ✅ `ensureHostExists` properly creates host records
- ✅ Console logging for debugging

### 3. `app/(main)/page.tsx` (Homepage)
Fixed listing display:

- ✅ Query: `.not("published_at", "is", null)` 
- ✅ Image fallback with placeholder
- ✅ Title fallback from property type + city
- ✅ Ordered by `published_at` descending

### 4. `app/(main)/listings/page.tsx`
Same fixes as homepage for listing grid.

---

## 🚀 INSTALLATION

### Step 1: Run Migration
```sql
-- In Supabase SQL Editor
-- Copy contents of scripts/migrations/000_foundation_schema.sql
-- Execute it
```

### Step 2: Replace Files
Copy these files from the zip:
- `app/(auth)/actions.ts`
- `app/(main)/page.tsx`
- `app/(main)/listings/page.tsx`

### Step 3: Update Listing Creation
Make sure your listing creation code sets `published_at`:
```typescript
// When publishing a listing:
const insertData = {
  // ... other fields ...
  published_at: status === "published" ? new Date().toISOString() : null,
}
```

---

## 🔍 ENTITY CREATION FLOW

```
SIGNUP:
  auth.users ──trigger──> profiles (roles: ['guest'])
                              │
                              ▼
BECOME HOST:                profiles (roles: ['guest', 'host'])
  ensureHostExists() ──────> hosts ──trigger──┘
         │
         ▼
CREATE LISTING:
  createListing() ──────────> listings
                               │
                               └──> published_at = NOW() for published
```

---

## ✅ VERIFICATION CHECKLIST

After applying fixes:

- [ ] Run migration 000_foundation_schema.sql
- [ ] New signup creates user + profile (via trigger)
- [ ] Login works and shows correct roles
- [ ] `/become-a-host` creates host record
- [ ] Host can create listing with `published_at` set
- [ ] Homepage shows listings where `published_at IS NOT NULL`
- [ ] Images display or show fallback placeholder
- [ ] Titles show (from `title` field or generated)

---

## 🐛 DEBUGGING

All operations log with prefixes:
- `[AUTH]` - Authentication
- `[HOST]` - Host creation
- `[HOME]` - Homepage queries
- `[LISTINGS]` - Listings page queries

Check server console for these logs.

---

## ⚠️ KNOWN ARCHITECTURAL SMELLS (Future Cleanup)

1. **Consider removing `status` column entirely** - Use only `published_at`
2. **Add folder structure enforcement later** - Then tighten storage delete policy
3. **Add `published_at` index for performance** - Already included in migration
