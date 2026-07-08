# Expense Tracker — Zenith Ledger

A minimalist personal expense tracker built with Next.js, Supabase, and Tailwind CSS.

## Design Reference
Based on the "Minimalist Expense Dashboard" Stitch project — Zenith Ledger design system.
- Font: Hanken Grotesk (UI) + JetBrains Mono (data/labels)
- Primary accent: #2D9CDB (muted teal/blue)
- Layout: 260px fixed sidebar + 1100px max-width content area
- Flat tonal layering, no heavy shadows, 1px borders

## Tech Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Supabase (Postgres + Auth)
- **Styling**: Tailwind CSS v4
- **Icons**: lucide-react
- **Charts**: recharts

## Setup

### 1. Supabase Setup
1. Create a new [Supabase](https://supabase.com) project
2. Go to the SQL editor and run `supabase/schema.sql`
3. Enable email auth in Authentication → Providers → Email
4. Create a user in Authentication → Users

### 2. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features
- ✅ Email/password login (personal tool, no signup)
- ✅ Add / edit / delete expenses
- ✅ 6 categories: Food, Transport, Bills, Shopping, Health, Other
- ✅ Month selector with prev/next navigation
- ✅ Summary cards: spent, budget remaining, top category
- ✅ Expense list grouped by date
- ✅ Category breakdown widget with progress bars
- ✅ Donut chart (Categories page)
- ✅ Monthly budget caps per category (Settings page)
- ✅ PHP currency formatting (₱)
- ✅ Row Level Security — data is strictly per-user
- ✅ Dark mode support

## Project Structure

```
app/
  (app)/          — Authenticated app routes
    page.tsx      — Dashboard
    categories/   — Category breakdown
    settings/     — Budget settings
  login/          — Login page
  api/expenses/   — REST endpoint for month-based expense fetch
components/
  layout/         — Sidebar
  dashboard/      — Dashboard components
  expenses/       — Add/Edit/Delete modals
  categories/     — Category chart
  settings/       — Budget settings form
lib/
  supabase/       — Client, server, middleware helpers
  types.ts        — TypeScript types
  utils.ts        — Formatting & helpers
  category-icons.ts
supabase/
  schema.sql      — DB schema with RLS policies
```
"# expense-tracker" 
"# expense-tracker" 
