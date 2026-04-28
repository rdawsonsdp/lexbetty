# LexBetty - Lexington Betty Smokehouse Catering Platform

## Overview
B2B catering ordering platform for Lexington Betty Smokehouse (LBSH), a BBQ restaurant in Chicago by Chef Dominique Leach. Enables corporate clients and event planners to order catering via packages or a la carte menu.

## Tech Stack
- **Framework:** Next.js 14.2.18 with TypeScript, App Router
- **Styling:** Tailwind CSS 4 with custom brand config
- **Database:** Supabase (PostgreSQL with RLS)
- **AI:** Anthropic Claude SDK (concierge), OpenAI (fallback)
- **Payments:** QuickBooks Online (invoicing, payment links)
- **Email:** Resend API
- **Hosting:** Vercel
- **PDF:** jsPDF (client-side generation)

## Commands
- `npm run dev` — Start dev server with Turbo
- `npm run build` — Production build
- `npm run lint` — ESLint
- Dev server binds to all interfaces: `npx next dev --turbo --hostname 0.0.0.0`

## Brand Colors & Fonts
- **Charcoal:** #1A1A1A (primary dark, headers, nav)
- **Smokehouse Orange:** #E8621A (accent, CTAs, prices)
- **Cream:** #F5EDE0 (page backgrounds)
- **Light Brown:** #E8E0D4 (cart drawer background)
- **Muted Gray:** #9B9189 (secondary text)
- **Fonts:** Oswald (display/headings), Roboto Condensed (body)

## Project Structure
```
app/
  page.tsx              — Homepage (hero + 4 selection cards)
  plan/page.tsx         — Event planner (headcount → budget → menu)
  products/page.tsx     — A la carte menu (ProductSelectionStep)
  packages/page.tsx     — Menu packages (Party Deal, Executive, etc.)
  food-truck/page.tsx   — Food truck dedicated page
  checkout/page.tsx     — Checkout form (contact, delivery, event details)
  order-confirmation/   — Post-order confirmation
  admin/                — Admin dashboard (orders, menu, customers, etc.)
  api/                  — API routes
components/
  layout/               — Header, Footer, Layout, CartDrawer
  catering/             — ProductSelectionStep, PackageSelectionStep, EventInfoStep, etc.
  marketing/            — ValueProposition
  ui/                   — Card, Button, Badge, etc.
context/
  CateringContext.tsx   — Global cart/order state (reducer pattern)
lib/
  packages.ts           — Package definitions (Party Deal, Executive, Food Truck)
  products.ts           — Hardcoded product fallbacks
  pricing.ts            — Price calculation engine (pan, tray, per-person, etc.)
  event-types.ts        — Event type configs
  types.ts              — Core TypeScript interfaces
  order-pdf.ts          — PDF generation for orders/packing slips
  supabase/             — Database clients and helpers
```

## Key Architectural Decisions

### Homepage Flow
4 cards on homepage, each navigates to a dedicated page:
1. **Try Our Event Planner** → `/plan` (headcount/budget wizard → menu)
2. **Order A La Carte** → `/products` (full menu with categories)
3. **Order Menu Packages** → `/packages` (Party Deals, Betty Boxes)
4. **Reserve Our Food Truck** → `/food-truck` (dedicated page)

### Cart System
- Cart state lives in `CateringContext` with `selectedItems: SelectedCateringItem[]`
- Packages added as flat-price products: `pricing: { type: 'flat', flatPrice: headcount * pricePerPerson }`
- Package descriptions include guest breakdown + included items (newline-separated)
- CartDrawer uses `calculatedItems` from context for accurate pricing (handles pan/tray/per-person/flat)
- Cart drawer slides out from right, triggered by header cart icon

### Pricing
- 8 pricing types: tray, pan, per-person, per-dozen, per-each, per-lb, per-container, flat
- `calculateAllOrderItems()` in `lib/pricing.ts` is the source of truth for all price calculations
- Package items use `flat` pricing to avoid double-counting with the headcount multiplier

### Breadcrumb
3-step breadcrumb: **Plan. → Order. → Pay.** (in StepIndicator component)
- Highlights based on current URL path, not step numbers

### Navigation
- HOME link → lexingtonbetty.com (external, main restaurant site)
- CATERING MENU → /#order (homepage cards)
- Cart icon in header (mobile + desktop) opens slide-out CartDrawer

## Database (Supabase)
Key tables: `orders`, `products`, `settings`, `concierge_rules`
- `orders.customer_notes` — Customer-facing notes (accordion on checkout)
- `orders.admin_notes` — Internal admin notes
- `orders.special_instructions` — Kitchen/dietary instructions

## Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `NEXT_PUBLIC_BASE_URL`

## Footer
"Powered by 86ai" linking to eightysixai.com
