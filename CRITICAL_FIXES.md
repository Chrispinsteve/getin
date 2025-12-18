# GetIn - Critical Fixes Documentation

## 🔴 CRITICAL ISSUES FOUND AND FIXED

### Issue 1: HOSTS TABLE DID NOT EXIST

**Symptom**: 
- `ensureHostExists()` always failed
- Users could not become hosts
- Listings failed to create with FK constraint errors

**Root Cause**:
The `hosts` table was **referenced in migrations but never created**. The migration file `002_guest_backend_complete.sql` had triggers and FK references to `public.hosts`, but no `CREATE TABLE` statement.

**Fix**: 
Created `000_foundation_schema.sql` which creates the hosts table with all required columns:
- `id`, `user_id`, `email`, `first_name`, `last_name`
- `is_superhost`, `verified`, `average_rating`
- `response_rate`, `response_time_hours`
- Proper RLS policies

---

### Issue 2: LISTINGS TABLE MISSING CRITICAL COLUMNS

**Symptom**:
- Creating listings failed
- Titles not showing
- Images not displaying

**Root Cause**:
The `001_create_listings_table.sql` only created basic columns. The code expected:
- `host_id` (FK to hosts)
- `title`, `description`
- `bedrooms`, `beds`, `bathrooms`, `max_guests`
- `house_rules`, `slug`, `published_at`
- Various count columns

**Fix**:
`000_foundation_schema.sql` adds all missing columns with proper defaults.

---

### Issue 3: PROFILE CREATION RACE CONDITION

**Symptom**:
- Sometimes users had no profile after signup
- Role checks failed silently
- Login redirected to wrong places

**Root Cause**:
Two mechanisms tried to create profiles:
1. Database trigger `handle_new_user()` (may not exist)
2. `signUp()` action upsert (ran after auth)

If trigger didn't exist and upsert failed due to RLS, no profile was created.

**Fix**:
1. Database trigger uses `ON CONFLICT DO UPDATE` to handle races
2. Auth actions explicitly call `ensureProfileExists()` 
3. Profile creation is logged for debugging

---

### Issue 4: LOGIN REDIRECT FAILURES

**Symptom**:
- Login succeeded but user returned to homepage
- Sessions existed but UI showed logged out state
- Redirect loops when accessing protected routes

**Root Cause**:
1. Profile fetch could fail silently
2. Empty `redirectTo` was truthy (`""`)
3. No logging made debugging impossible

**Fix**:
1. `signIn()` now ensures profile exists before redirect
2. Added explicit `redirectTo.trim() !== ""` check
3. Added comprehensive console logging with `[AUTH]` prefix

---

### Issue 5: IMAGES NOT DISPLAYING

**Symptom**:
- Listings visible but images were blank
- No fallback when images missing

**Root Cause**:
1. Images stored in `photos` JSONB column with mixed formats
2. No fallback UI for missing images
3. Storage bucket may be private

**Fix**:
1. `getListingImageUrl()` helper handles all formats:
   - `photos[0].url` (object format)
   - `photos[0]` (string format)
   - `images[0]` (alternative column)
2. Fallback UI shows placeholder with "Photo à venir"
3. Migration sets storage bucket to PUBLIC

---

### Issue 6: TITLES NOT SHOWING

**Symptom**:
- Listing cards showed "Logement" instead of actual title
- Host-defined titles not displayed

**Root Cause**:
1. `title` column didn't exist in database
2. Code had wrong fallback chain

**Fix**:
1. Added `title` column in migration
2. `getListingTitle()` helper with proper fallback:
   - First: actual `title` field
   - Fallback: Generated from `property_type` + `city`

---

## 📋 ENTITY CREATION FLOW (AFTER FIXES)

| Entity | Table | Created When | Created By | Verified |
|--------|-------|--------------|------------|----------|
| User | `auth.users` | Signup submit | Supabase Auth | ✅ |
| Profile | `profiles` | Immediately after auth | DB trigger + action fallback | ✅ |
| Host | `hosts` | First call to `ensureHostExists()` | `ensureHostExists()` in actions | ✅ |
| Listing | `listings` | `createListing()` completes | become-a-host/actions | ✅ |
| Images | `listing-photos` bucket | Photo upload step | `uploadListingPhoto()` | ✅ |

---

## 🚀 MIGRATION ORDER

**CRITICAL**: Run migrations in this exact order:

```bash
1. scripts/migrations/000_foundation_schema.sql   # FIRST - creates hosts table
2. scripts/001_create_listings_table.sql          # If not already run
3. scripts/migrations/002_guest_backend_complete.sql
4. scripts/migrations/003_fix_profiles_table.sql  # Optional - already in 000
```

The `000_foundation_schema.sql` is idempotent - safe to run multiple times.

---

## 🔐 RLS POLICIES SUMMARY

### profiles
- SELECT: own profile only
- INSERT: own profile only
- UPDATE: own profile only

### hosts
- SELECT: public (for listing pages)
- INSERT: own record only
- UPDATE: own record only

### listings
- SELECT: published listings (public) OR own listings (hosts)
- INSERT: hosts only (via host_id FK)
- UPDATE: own listings only
- DELETE: own listings only

### storage (listing-photos)
- SELECT: public
- INSERT: authenticated users
- DELETE: own folder only

---

## 🧪 VERIFICATION CHECKLIST

After applying fixes, verify:

- [ ] New user can sign up without database errors
- [ ] New user automatically has profile with `roles: ['guest']`
- [ ] User can log in and is redirected correctly
- [ ] Going to `/become-a-host` creates host record
- [ ] Host can create listing with title and images
- [ ] Published listings appear on homepage
- [ ] Listing images display (or show placeholder)
- [ ] Listing titles are visible to guests

---

## 📝 DEBUGGING

All auth operations now log with prefixes:
- `[AUTH]` - Authentication operations
- `[HOST]` - Host creation operations
- `[HOME]` - Homepage data fetching
- `[LISTINGS]` - Listings page operations

Check server console for these logs when debugging issues.
