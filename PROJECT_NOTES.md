# Zenith Ledger — Project Notes

Zenith Ledger is a personal finance companion app designed to help users (particularly students) manage their budget limits, track daily transactions, build savings goals, and plan for recurring bills.

---

## Tech Stack
- **Framework**: Next.js (App Router)
- **Database / Auth**: Supabase (PostgreSQL with RLS)
- **Styling**: Vanilla CSS with Tailwind CSS utilities
- **State & Icons**: React hooks, Lucide Icons, Recharts (for analytics visualization)

---

## Database Schema & Tables

All tables exist in the `public` schema of Supabase. Row-Level Security (RLS) is enabled on all tables, protecting access using policy checks scoped to `auth.uid() = user_id`.

### 1. `expenses`
Stores individual transaction records.
- `id` (UUID, PK): Unique transaction identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the owning user.
- `amount` (NUMERIC): Amount of the expense.
- `category` (TEXT): Category name (e.g., Food, Transport, Rent, etc.).
- `date` (DATE): Transaction date.
- `description` (TEXT, Nullable): Optional note about the expense.
- `tags` (TEXT[], Nullable): Array of text tags.
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

### 2. `allowances`
Defines weekly spending limits.
- `id` (UUID, PK): Unique record identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the user.
- `amount` (NUMERIC): The weekly limit amount.
- `week_start` (DATE): Monday date of the week (Philippine Time - PHT).
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

### 3. `budgets`
Sets monthly spending caps on a per-category basis.
- `id` (UUID, PK): Unique record identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the user.
- `category` (TEXT): Category name.
- `monthly_cap` (NUMERIC): Upper spending limit.
- `month` (TEXT): Month format string (`YYYY-MM`).
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

### 4. `income`
Tracks income entries (informational — does NOT feed into weekly allowance/available-to-spend calculations).
- `id` (UUID, PK): Unique record identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the user.
- `amount` (NUMERIC): Income amount (must be > 0).
- `source` (TEXT): Source label (e.g. "Freelance", "Allowance", "Dink 'n Brew").
- `date` (DATE): Date the income was received.
- `note` (TEXT, Nullable): Optional context note.
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

### 4. `recurring_bills`
Tracks subscriptions and recurring bill commitments.
- `id` (UUID, PK): Unique record identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the user.
- `name` (TEXT): Name of the subscription or bill (e.g. "Spotify", "Rent").
- `amount` (NUMERIC): Monthly amount due.
- `due_day` (INTEGER): Calendar day of the month due (1 to 31).
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

### 5. `bill_savings_progress`
Logs accumulated savings reserved for specific upcoming bills.
- `id` (UUID, PK): Unique record identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the user.
- `bill_id` (UUID, FK -> `recurring_bills`): Target recurring bill.
- `month` (TEXT): Savings month (`YYYY-MM`).
- `amount_saved` (NUMERIC): Amount saved so far for this bill.
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

### 6. `savings_goals`
Tracks progress toward customized mid/long-term financial milestones.
- `id` (UUID, PK): Unique record identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the user.
- `name` (TEXT): Name of the goal (e.g., "Laptop", "Emergency Fund").
- `target_amount` (NUMERIC): The final target savings amount.
- `target_date` (DATE): Target date to reach the goal.
- `amount_saved` (NUMERIC): Current saved progress.
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

### 7. `expense_templates`
Quick-add template buttons that speed up logging common transactions.
- `id` (UUID, PK): Unique record identifier.
- `user_id` (UUID, FK -> `auth.users`): Reference to the user.
- `label` (TEXT): Button label (e.g., "Bus Ticket", "Starbucks").
- `amount` (NUMERIC): Preset transaction amount.
- `category` (TEXT): Preset category.
- `created_at` (TIMESTAMPTZ): Auto-generated timestamp.

---

## App Feature Map & Navigation

- **Overview Page (`/`)**: Bird's-eye view consolidating weekly allowance, spending comparison (this month vs last month), upcoming bills (top 3 due soonest), active savings goals progress, and category budget alerts.
- **Dashboard (`/dashboard`)**: The main ledger. Contains daily spending chart, weekly allowance card, recent transaction history, quick-add template buttons, recent expenses filtering, and transaction addition/editing modals.
- **Categories Breakdown (`/categories`)**: Breakdown of current month spending by categories with interactive pie chart visualizations and printed export reports.
- **Bills & Savings (`/bills`)**: Panel to configure monthly subscription bills, schedule payments, and set aside progress savings towards them.
- **Budget Tracker (`/budgets`)**: Page to establish monthly category cap limits and view color-coded progress bars (green/amber/red warnings).
- **Savings Goals (`/goals`)**: Dedicated page to list savings milestones, add new ones, and increment current savings progress.
- **Settings (`/settings`)**: Preferences for system theme preferences (Light / Dark / System mode).

---

## Known Quirks, Constraints & Decisions

1. **Allowance vs Old Monthly Budgets**:
   - The system was refactored to consolidate the old monthly budget limits into a **Weekly Allowance** card. Weekly available spending limits are calculated dynamically by taking the weekly allowance and subtracting both actual spent expenses and active weekly bill savings targets:
     `available = allowance - weekly_bill_reserve - week_expenses`
2. **Weekly Bill Savings Target**:
   - Weekly bill targets calculate how much money must be set aside each week to pay upcoming bills on time. The remaining amount to save is divided by the weeks remaining before the due date. The system **always rounds weeks remaining up** (i.e. partial weeks count as full weeks) so the user is never caught short on a bill due day.
3. **Expense Tags Formatting**:
   - Tags are saved as PostgreSQL `text[]` arrays. When inserting/updating expenses, the comma-separated text is parsed, whitespace trimmed, and written to Supabase as an array of tags (`string[]`). For displaying, it is joined back with comma separation. A fallback is implemented to parse legacy string tag values.
4. **Supabase Region Identification**:
   - The remote Supabase server is located in the `ap-southeast-2` (Sydney) region on the `aws-1` connection pooler (`aws-1-ap-southeast-2.pooler.supabase.com:6543`).

---

## Developer Note for Future Sessions

> [!IMPORTANT]
> **Always apply migrations directly to the remote Supabase database first.**
> If you add new database tables, columns, or policies, make sure to execute the SQL files (in the `supabase/` folder) directly against the remote Supabase SQL Editor in the Dashboard. The Next.js application requires these columns and tables to exist in Supabase beforehand to pass TypeScript lint checks and runtime fetches.
