# GetIn - Home Sharing Platform

## Overview

GetIn is a modern home-sharing platform built with Next.js 15.3.4 that enables hosts to list properties and earn income through rentals. The application features a marketing landing page and a comprehensive multi-step host onboarding flow. It positions itself as a next-generation alternative to traditional platforms like Airbnb, emphasizing smart pricing, instant payouts, and host-centric features.

The platform targets the Haitian market initially, with support for MonCash and international payment methods. The application is built using React Server Components (RSC) and includes sophisticated UI components powered by shadcn/ui and Radix UI primitives.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2025-12-05)

- Migrated from Tailwind CSS v4 to v3.4.18 for better stability and lower memory usage
- Updated Next.js to version 15.3.4 
- Added `allowedDevOrigins` config for Replit development environments
- Enabled `webpackMemoryOptimizations` experimental feature to reduce build memory usage
- Created `tailwind.config.ts` with HSL-based color system compatible with shadcn/ui
- Updated `globals.css` to use Tailwind v3 directives (@tailwind base/components/utilities)
- Fixed PostCSS configuration to use standard tailwindcss plugin

## System Architecture

### Frontend Architecture

**Framework**: Next.js 15.3.4 with App Router
- The application uses Next.js App Router with React Server Components (RSC) enabled
- TypeScript is used throughout with strict mode enabled
- File-based routing under the `/app` directory
- Server actions for data mutations (see `app/become-a-host/actions.ts`)

**UI Component System**: shadcn/ui with Radix UI
- Component library based on shadcn/ui "new-york" style variant
- Comprehensive component set including forms, dialogs, navigation, and data display
- All UI components located in `components/ui/` directory
- Uses Radix UI primitives for accessibility and interaction patterns
- Custom component slots pattern for flexible composition

**Styling Architecture**
- Tailwind CSS v3.4.18 with custom configuration using CSS/HSL variables
- HSL color space for theme colors with shadcn/ui compatibility
- Dark mode support via CSS custom properties (.dark class)
- Responsive design with mobile-first approach
- Custom animations via `tailwindcss-animate` plugin

**State Management**
- React hooks for local component state
- React Hook Form with Zod resolvers for form validation
- Server state managed through Next.js server actions
- No global state management library (Redux, Zustand) currently implemented

### Multi-Step Onboarding Flow

The host onboarding process (`/become-a-host`) implements a wizard-style flow with 6 steps:

1. **Property Type Selection** - Choose accommodation category
2. **Location Entry** - Address and geocoding information
3. **Amenities Selection** - Categorized amenity checkboxes
4. **Photo Upload** - Drag-and-drop image management
5. **Pricing & Availability** - Dynamic pricing, calendar blocking, booking rules
6. **Review & Publish** - Final confirmation and submission

**Design Patterns**:
- Controlled components pattern with parent state management
- Step validation before proceeding
- Draft saving capability
- Progress indicator with step navigation
- Data persistence through server actions

### Backend Architecture

**Data Layer**: Supabase Integration
- Supabase client configured for SSR (`@supabase/ssr`)
- Server-side client creation pattern in `lib/supabase/server`
- Database schema inferred from server actions (listings table with columns for property details, location, pricing, amenities, photos)

**Server Actions**
- `createListing` action handles both draft and published states
- Type-safe data transformations between frontend and database schema
- Revalidation pattern for cache invalidation

**Expected Database Schema** (inferred from actions):
```
listings table:
- property_type: string
- country, street, city, state, zip: string
- latitude, longitude: nullable numbers
- amenities: array
- photos: array of objects
- base_price, cleaning_fee, additional_guest_fee: numbers
- smart_pricing, instant_book: booleans
- blocked_dates: array
- min_stay, max_stay: numbers
- status: 'draft' | 'published'
```

### Authentication & Authorization

**Framework**: Supabase Auth
- SSR-compatible authentication via `@supabase/ssr`
- No auth UI components currently implemented in the repository
- Authentication state management ready for implementation

### Design System Decisions

**Typography**
- Primary font: Inter (sans-serif)
- Monospace font: Geist Mono
- CSS variable-based font system for easy swapping

**Color System**
- OKLCH color space for perceptually uniform colors
- Comprehensive theme variables for light/dark modes
- Semantic color tokens (primary, accent, destructive, muted, etc.)
- Chart-specific color palette for data visualization

**Component Composition**
- Slot-based component pattern for flexible rendering
- Variant-based styling via `class-variance-authority`
- Consistent data-slot attributes for styling hooks
- Responsive sizing and spacing tokens

**Accessibility**
- ARIA labels and roles throughout UI components
- Keyboard navigation support
- Focus management patterns
- Screen reader-friendly markup

### Performance Optimizations

**Image Handling**
- Next.js Image component for automatic optimization (configured but not yet used extensively)
- Client-side preview generation for uploads via `URL.createObjectURL`

**Code Splitting**
- Automatic code splitting via Next.js App Router
- Client component boundaries clearly marked with "use client"
- Server components used by default for better performance

**Analytics**
- Vercel Analytics integration for performance monitoring

### Routing Architecture

**Public Routes**:
- `/` - Marketing landing page
- `/become-a-host` - Multi-step host onboarding

**Route Protection**: Not yet implemented but prepared for via Supabase auth

## External Dependencies

### Core Framework Dependencies
- **Next.js** (latest): React framework with App Router and SSR
- **React** (v19+): UI library with Server Components support
- **TypeScript**: Type safety and developer experience

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component collection (not a package, composed locally)
- **Radix UI**: Headless UI primitives for accessibility
  - Multiple Radix packages for accordion, dialog, dropdown, etc.
- **class-variance-authority**: Type-safe variant styling
- **clsx** & **tailwind-merge**: Conditional class name handling
- **Lucide React**: Icon library

### Form Management
- **React Hook Form**: Form state and validation
- **@hookform/resolvers**: Integration with validation schemas
- **Zod** (implied): Schema validation (not in visible package.json but referenced in types)

### Backend Services
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`): 
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions (available but not yet used)
  - Row Level Security for data access control

### UI Enhancement Libraries
- **cmdk**: Command palette component
- **date-fns**: Date manipulation and formatting
- **embla-carousel-react**: Carousel/slider functionality
- **input-otp**: One-time password input
- **vaul**: Drawer component (used in mobile menu)
- **next-themes**: Theme management for dark mode

### Analytics
- **@vercel/analytics**: Performance and usage analytics

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

### Payment Integrations (Mentioned but Not Implemented)
- MonCash (for Haitian market)
- PayPal (for international transactions)

Note: The application is configured for Supabase but could be adapted to use other databases. The server actions pattern allows for easy swapping of data persistence layers.