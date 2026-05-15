# KharchaSplit v2 — Changes from v1

This document describes **only the changes** from the v1 spec. Everything not mentioned here remains exactly as defined in v1.

---

## Summary of Changes

| # | Change | Type |
|---|---|---|
| 1 | iOS safe area fix — content overlaps iPhone status bar / Dynamic Island | Bug fix |
| 2 | Investment portfolio tracking — new tab, screens, tables | Feature |
| 3 | Delete user account from Settings | Feature |
| 4 | Recurring payments — for group expenses, personal expenses, and investment valuations | Feature |

---

## 1. iOS Safe Area Fix

**Problem:** On iPhones (especially with Dynamic Island / notch), page content bleeds behind the status bar and home indicator. Headers, text, and tap targets overlap the system UI.

**Root cause:** The app uses `viewport-fit=cover` (needed for edge-to-edge PWA feel) but doesn't apply safe area inset padding to the content areas.

**Fix — apply these changes:**

### `globals.css`
Add safe-area CSS custom properties and apply them to the layout shells:

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
```

### `app/(main)/layout.tsx`
The main layout wrapper must pad for safe areas:

- Top: the `PageHeader` (or the top of the scroll area if there's no header) gets `padding-top: var(--safe-top)` so content starts below the status bar / Dynamic Island.
- Bottom: the `BottomTabs` bar gets `padding-bottom: var(--safe-bottom)` so tabs clear the home indicator.
- The scrollable content area between header and tabs should account for both: top safe area (if no sticky header absorbs it) and bottom safe area (the tab bar height + its bottom padding).

### `components/layout/PageHeader.tsx`
Add `pt-[env(safe-area-inset-top)]` (or the CSS var equivalent) to the header's outer container. The header background color should extend behind the status bar (full bleed), but the header *content* (title, icons) must sit below the inset.

### `components/layout/BottomTabs.tsx`
Add `pb-[env(safe-area-inset-bottom)]` to the tab bar container. The bar background extends to the bottom edge, but tab icons/labels sit above the home indicator.

### `app/login/page.tsx`
Login is outside the `(main)` layout, so it needs its own safe area padding: `px-[env(safe-area-inset-left)]` and `pt-[env(safe-area-inset-top)]`.

### Bottom sheets (all Sheet components)
Sheet content should add `pb-[env(safe-area-inset-bottom)]` so the bottom action buttons aren't obscured by the home indicator on iPhones without a home button.

**Test:** On iPhone (or Safari devtools responsive mode with "Show safe areas"), verify:
- No content sits behind the Dynamic Island / notch
- Bottom tab labels are fully visible above the home indicator
- Bottom sheet buttons are tappable without reaching behind the home bar
- The `bg` color fills behind the status bar (no white/gap)

---

## 2. Investment Portfolio Tracking

### 2.1 Design System Additions

Three new UX rules (appended to v1's list of 8):

9. **Green = profit, red = loss.** P&L amounts and return percentages use `success` (#22C55E) for gains and `danger` (#EF4444) for losses — same tokens already used for group balances.
10. **No live data, no APIs.** All investment values are entered manually. Works for every asset type.
11. **Monthly cadence.** One valuation per investment per month is the intended rhythm. Multiple entries in the same month are allowed (latest wins for display), but charts are month-granular.

### 2.2 Bottom Tabs Change

**Old:** `Groups | Personal | Analytics | Settings` (4 tabs)
**New:** `Groups | Personal | Invest | Analytics | Settings` (5 tabs)

The **Invest** tab uses the `TrendingUp` icon from lucide-react.

Update `components/layout/BottomTabs.tsx` to add the fifth tab pointing to `/invest`.

### 2.3 New Screens

#### `/invest` — Portfolio Overview

**Portfolio Summary Card** (top, always visible):
- Total Invested — sum of all `principal` amounts across active investments
- Current Value — sum of latest valuation for each investment
- Overall P&L — `Current Value − Total Invested`, colored green/red
- Overall Return % — `((Current Value − Total Invested) / Total Invested) × 100`, with ▲/▼ arrow

**Investment Cards** (scrollable list):
Each card: category emoji + name, "Invested ₹X" (muted), latest value (large bold), P&L % (colored), last updated date (dim). Tap → detail page.

**Empty state:** 💰 + "No investments yet" + "Start tracking your portfolio" + CTA

**FAB** → Add Investment sheet

**Overflow menu** (top-right): Export Investments CSV

#### Add / Edit Investment (bottom sheet)

- **Name** (required, max 100 chars)
- **Category** — chip select from investment categories (see §2.7)
- **Principal Amount** (required, numeric, auto-focused) — cost basis, editable later
- **Start Date** (defaults to today)
- **Note** (optional, behind "Show advanced" toggle)

On save → auto-creates first valuation entry with `value = principal` and `date = start_date`.

#### `/invest/[id]` — Investment Detail

**Header:** Category icon + Name. Overflow menu → Edit Investment, Delete Investment (confirmation dialog).

**Value Summary Card:**
- Principal ₹X | Current Value ₹Y (large bold)
- P&L ₹Z (colored) + Return % (colored, ▲/▼)
- XIRR (annualized return) — shows "—" if fewer than 2 data points

**Performance Chart:**
- Recharts `AreaChart`, x-axis months (MMM YY), y-axis ₹ value
- Horizontal dashed reference line at principal amount labeled "Invested"
- Area fill: `brand` (#8BAE66) gradient at 20% opacity
- Segments below principal use `danger` color

**Valuation History** (list, newest first):
Each row: date, value, change from previous (₹ + %, colored). Tap to edit, swipe/long-press to delete.

**FAB** → Add Valuation entry

#### Add / Edit Valuation (bottom sheet)

- **Value** (required, numeric, auto-focused)
- **Date** (defaults to 1st of current month)

If a valuation for the exact date exists, show warning chip: "Entry for this date exists — saving will replace it." Upsert on confirm.

### 2.4 Analytics Changes

**Scope filter** gets a new option: `All | Personal Only | <group> | **Investments**`

When scope = "Investments":
- Category Breakdown → donut by investment category, sized by current value
- Group Comparison → replaced with Portfolio Allocation horizontal bar (one bar per investment)
- Per Person Spend → hidden
- Monthly Trend → Portfolio Value Trend (total portfolio value at each month-end)

New stat card (visible in all scopes):
- **Net Worth Snapshot** — Total Portfolio Value vs Total Expenses (all time), two big numbers side by side

### 2.5 Settings Changes

- **Export all data** CSV now includes an Investments section: `Investment Name, Category, Principal (₹), Current Value (₹), P&L (₹), Return %, Start Date, Last Updated, Note`
- **Danger zone → Clear all data** now also deletes `investments` and `investment_valuations` rows for the workspace.

### 2.6 Data Model — New Tables

Additive migration: `supabase/migrations/0002_investments.sql`. No v1 tables are altered.

#### `investments`

```sql
CREATE TABLE IF NOT EXISTS investments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace     TEXT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  category      VARCHAR(30) NOT NULL DEFAULT 'other-inv',
  principal     DECIMAL(14,2) NOT NULL CHECK (principal > 0),
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- `principal` — DECIMAL(14,2) to handle larger amounts (up to ₹99,99,99,99,99,999.99)
- `is_active` — soft-delete flag. Inactive investments hidden from list but kept for history. Toggle in edit form: "Mark as closed/exited."

#### `investment_valuations`

```sql
CREATE TABLE IF NOT EXISTS investment_valuations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace       TEXT NOT NULL,
  investment_id   UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  value           DECIMAL(14,2) NOT NULL CHECK (value >= 0),
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(investment_id, date)
);
```

- `value` — can be 0 (total loss) but not negative
- `UNIQUE(investment_id, date)` — one valuation per investment per date; app upserts on conflict

#### Indexes, RLS, Triggers

```sql
CREATE INDEX IF NOT EXISTS idx_investments_workspace ON investments(workspace);
CREATE INDEX IF NOT EXISTS idx_investments_category ON investments(category);
CREATE INDEX IF NOT EXISTS idx_valuations_workspace ON investment_valuations(workspace);
CREATE INDEX IF NOT EXISTS idx_valuations_investment ON investment_valuations(investment_id);
CREATE INDEX IF NOT EXISTS idx_valuations_date ON investment_valuations(date DESC);
CREATE INDEX IF NOT EXISTS idx_valuations_latest ON investment_valuations(investment_id, date DESC);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_valuations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investments_all" ON investments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "valuations_all" ON investment_valuations FOR ALL USING (true) WITH CHECK (true);

-- Reuses touch_updated_at() from 0001_init.sql
CREATE TRIGGER investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
```

### 2.7 Investment Categories

Built-in categories in `lib/investment-categories.ts`:

| Emoji | ID | Name |
|---|---|---|
| 📊 | `mutual-fund` | Mutual Fund |
| 📈 | `stocks` | Stocks |
| 🏦 | `fixed-deposit` | Fixed Deposit |
| 🪙 | `gold` | Gold |
| 💎 | `crypto` | Crypto |
| 🏠 | `real-estate` | Real Estate |
| 🏛️ | `ppf-epf` | PPF / EPF |
| 💰 | `nps` | NPS |
| 📄 | `bonds` | Bonds |
| 🔒 | `savings` | Savings Account |
| 📦 | `other-inv` | Other |

Custom investment categories use the same localStorage pattern as expense customs, stored under `kharcha.customInvestmentCategories`. Resolver: `investmentCategoryById()`.

### 2.8 Investment Calculations

New file: `lib/investments.ts`

**`computePortfolioSummary(investments, valuations)`** — for each active investment, finds latest valuation. Returns `{ totalInvested, currentValue, totalPnL, totalReturnPct, investments[] }` where each investment entry has `{ id, name, category, principal, currentValue, pnL, returnPct, lastUpdated }`.

**`computeXIRR(principal, startDate, valuations)`** — annualized return via Newton-Raphson. Cash flows: −principal at startDate, +latestValue at latest valuation date. Returns `null` if < 2 data points or non-convergence.

**`getMonthlyPortfolioTimeline(investments, valuations, months)`** — for each month, sums latest-known valuation per investment (carry-forward if no entry that month). Returns `{ month, value, invested }[]` for the trend chart.

### 2.9 New Files & Modified Files

```
NEW FILES:
  app/(main)/invest/page.tsx                    — portfolio overview
  app/(main)/invest/[id]/page.tsx               — investment detail
  components/investments/InvestmentForm.tsx      — add/edit investment sheet
  components/investments/InvestmentCard.tsx      — card in portfolio list
  components/investments/ValuationForm.tsx       — add/edit valuation sheet
  components/investments/ValuationListItem.tsx   — row in history list
  components/investments/PortfolioSummaryCard.tsx
  components/investments/InvestmentCategoryPicker.tsx
  components/investments/PerformanceChart.tsx    — area chart on detail page
  components/layout/RecurringBanner.tsx          — sticky banner for due recurrences
  components/recurring/RecurringPicker.tsx       — frequency/anchor/end selector for forms
  components/recurring/RecurringReviewSheet.tsx  — review & confirm pending entries
  hooks/use-investments.ts                      — CRUD, workspace-scoped
  hooks/use-valuations.ts                       — CRUD per investment, upsert on conflict
  hooks/use-portfolio.ts                        — computed summary + timeline
  hooks/use-custom-investment-categories.ts     — localStorage-backed
  hooks/use-delete-account.ts                   — ordered workspace deletion + logout
  hooks/use-recurring.ts                        — CRUD for recurring_rules + due-check
  lib/investments.ts                            — portfolio summary, XIRR, timeline
  lib/investment-categories.ts                  — defaults + resolver
  lib/recurrence.ts                             — getNextDueDate, checkDueRecurrences, generateFromRule
  supabase/migrations/0002_investments.sql

MODIFIED FILES:
  app/(main)/layout.tsx                         — safe area padding + 5th tab + RecurringBanner
  app/globals.css                               — safe area CSS vars
  app/login/page.tsx                            — safe area padding
  components/layout/BottomTabs.tsx              — 5th tab + bottom safe area
  components/layout/PageHeader.tsx              — top safe area
  components/ui/Sheet.tsx                       — bottom safe area on sheets
  components/expenses/ExpenseForm.tsx           — add Repeat field in advanced section
  components/investments/ValuationForm.tsx      — add Repeat field in advanced section
  app/(main)/analytics/page.tsx                 — Investments scope option
  app/(main)/settings/page.tsx                  — investments + delete user + recurring rules mgmt
  lib/supabase/types.ts                         — Investment, Valuation, RecurringRule row types
  lib/format.ts                                 — formatReturnPct, formatPnL helpers
  lib/csv.ts                                    — investments CSV builder
```

### 2.10 Setup (v2 upgrade)

For existing v1 deployments: open Supabase SQL Editor → paste and run `0002_investments.sql`. No env var changes needed.

---

## 3. Delete User Account

### Settings Screen Change

Add a new item in the **Danger zone** section of `/settings`, below "Clear all data":

**Delete account** — a destructive button (red text, `danger` color) that:

1. Shows a confirmation dialog: "This will permanently delete all your data — groups, expenses, settlements, investments, and settings. This cannot be undone."
2. Requires typing the workspace name (not `DELETE`) to confirm, so the user is certain which account they're deleting.
3. On confirm, executes workspace-scoped deletes across all tables in order (respecting foreign keys):
   - `investment_valuations WHERE workspace = ?`
   - `investments WHERE workspace = ?`
   - `settlements WHERE workspace = ?`
   - `expenses WHERE workspace = ?`
   - `groups WHERE workspace = ?`
   - `settings WHERE workspace = ?`
4. Clears `localStorage` keys: `kharcha.workspace`, `kharcha.customCategories`, `kharcha.customInvestmentCategories`
5. Redirects to `/login`

### Implementation

New hook: `hooks/use-delete-account.ts` — a mutation that runs the ordered deletes in sequential `.delete()` calls, then clears localStorage and navigates to login.

No schema changes needed — purely app-layer logic using the existing `workspace` column on every table.

---

## 4. Recurring Payments

### Concept

Any expense (group or personal) or investment valuation can be marked as recurring. The app stores a **recurring rule** — a template that defines what to create and how often. It does **not** auto-insert rows in the background (no cron, no service worker needed). Instead, on each app open, the recurrence engine checks for any rules that are "due" and surfaces a prompt to the user: "You have 3 recurring entries due — Add all / Review / Skip." The user stays in control; nothing is silently created.

### UX Rule Addition

12. **Recurring = reminders, not autopilot.** Recurring rules generate pending entries that the user confirms. This avoids phantom expenses filling up the ledger while someone is on vacation, and keeps the user aware of every entry.

### 4.1 How It Works

**Setting up a recurrence:**

In the Add/Edit Expense sheet (both group and personal) and the Add/Edit Valuation sheet, the "Show advanced" toggle reveals a new **Repeat** field:

- **Repeat** — chip select: `Never` (default) | `Daily` | `Weekly` | `Monthly` | `Yearly`
- When any repeat option other than "Never" is selected, two sub-fields appear:
  - **On** — contextual to frequency:
    - Daily: no sub-field needed
    - Weekly: day-of-week chips (Mon–Sun, default = current day)
    - Monthly: day-of-month number input (1–31, default = current date's day). If the month has fewer days, it snaps to the last day (e.g. 31 → 28 for Feb).
    - Yearly: month + day picker (default = current date)
  - **Ends** — chip select: `Never` | `On date` (date picker) | `After N occurrences` (number input)

When the user saves an expense or valuation with a repeat rule, two things happen:
1. The current expense/valuation is saved normally (as a regular row in `expenses` or `investment_valuations`).
2. A row is inserted into the new `recurring_rules` table capturing the template and schedule.

**Processing due recurrences:**

On app load (in the `WorkspaceProvider` or the main layout's `useEffect`), the app runs `checkDueRecurrences(workspace)`:

1. Fetch all active `recurring_rules` for the workspace.
2. For each rule, compute `next_due_date` based on `frequency`, `anchor_day`, `last_generated_date`, and `end_condition`.
3. If `next_due_date <= today`, the rule is "due." Collect all due rules.
4. If any are due, show a **Recurring Banner** at the top of whichever tab the user is on:
   - "🔄 3 recurring entries due" + `Add All` button + `Review` button
   - `Add All` — creates all pending entries in one batch, updates `last_generated_date` on each rule
   - `Review` — opens a sheet listing each pending entry with amount, title, and a checkbox to include/skip. Confirm creates only the checked ones.
   - The banner is dismissible (snooze until next app open).

**For investment valuations specifically:**

When a recurring rule fires for a valuation, it creates a **draft** valuation with `value = 0` and surfaces it in the Review sheet with the amount field editable — because the value changes every month and can't be templated. The user fills in the current value and confirms.

### 4.2 Recurring Rules Table

Added to `supabase/migrations/0002_investments.sql` (or a separate `0003_recurring.sql` if preferred):

```sql
CREATE TABLE IF NOT EXISTS recurring_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace           TEXT NOT NULL,

  -- What to create
  rule_type           VARCHAR(20) NOT NULL CHECK (rule_type IN ('expense', 'valuation')),
  template            JSONB NOT NULL,
  -- For expenses: { title, amount, category, group_id, is_personal, paid_by, paid_by_members,
  --                  paid_by_amounts, split_type, split_members, split_amounts, note }
  -- For valuations: { investment_id, value (0 = user fills in) }

  -- Schedule
  frequency           VARCHAR(10) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  anchor_day          SMALLINT,
  -- daily: NULL
  -- weekly: 0=Sun, 1=Mon, ..., 6=Sat
  -- monthly: 1–31 (day of month)
  -- yearly: encoded as MMDD (e.g. 115 = Jan 15, 1225 = Dec 25)

  -- End condition
  end_type            VARCHAR(10) NOT NULL DEFAULT 'never' CHECK (end_type IN ('never', 'on_date', 'after_count')),
  end_date            DATE,                    -- used when end_type = 'on_date'
  end_count           SMALLINT,                -- used when end_type = 'after_count'
  generated_count     SMALLINT DEFAULT 0,      -- how many times this rule has fired

  -- Tracking
  last_generated_date DATE,                    -- last date an entry was created from this rule
  is_active           BOOLEAN DEFAULT TRUE,    -- user can pause/resume
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_workspace ON recurring_rules(workspace);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_rules(workspace, is_active) WHERE is_active;

ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recurring_all" ON recurring_rules FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER recurring_rules_updated_at
  BEFORE UPDATE ON recurring_rules
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
```

**Why JSONB for `template`?** The template payload differs between expenses (12+ fields with arrays) and valuations (2 fields). JSONB avoids a wide table full of nullable columns and makes it easy to add new rule types later. The app-layer TypeScript interfaces enforce the shape.

### 4.3 Recurrence Engine

New file: `lib/recurrence.ts`

**`getNextDueDate(rule)`** — given a recurring rule and its `last_generated_date`, computes the next date the rule should fire. Handles month-end snapping (e.g. anchor_day=31 in February → Feb 28/29).

**`checkDueRecurrences(workspace, today)`** — fetches all active rules, runs `getNextDueDate` on each, returns the list of rules that are due (next_due_date ≤ today). Also returns how many occurrences are "stacked" (e.g. if the user hasn't opened the app in 3 months and a monthly rule is 3 months overdue, it generates 3 pending entries, not just 1).

**`generateFromRule(rule, dates[])`** — creates the actual expense or valuation rows from the template for each due date. For expenses, it inserts into `expenses` with the template fields + the computed date. For valuations, it inserts with `value = 0` (user fills in later). Updates `last_generated_date` and `generated_count` on the rule. If `end_type = 'after_count'` and `generated_count >= end_count`, sets `is_active = false`.

### 4.4 UI Changes for Recurring

**Expense forms (group + personal):**
- "Show advanced" section gains a **Repeat** field (chips: Never / Daily / Weekly / Monthly / Yearly) with sub-fields as described in §4.1.
- When editing an expense that was created from a recurring rule, show a muted label: "🔄 Repeats monthly" (or whichever frequency). Tapping it opens options: Edit schedule / Pause / Delete rule.

**Valuation form:**
- Same Repeat field in "Show advanced." Most common use: monthly valuation reminder for MFs/stocks.
- When a recurring valuation fires, the Review sheet shows the investment name + an editable amount field (pre-filled with 0 or last month's value as a hint).

**Recurring Banner component:**
- `components/layout/RecurringBanner.tsx` — sticky banner below the header (above content, below safe area). Shows count of due items + Add All / Review buttons.
- Only renders when `checkDueRecurrences` finds due items.
- Dismissed state stored in `sessionStorage` (reappears on next app open, not on tab switch).

**Settings page:**
- New section between "Export all data" and "Danger zone": **Recurring rules** — shows a list of all active rules with title/name, frequency, next due date. Each row has a pause/resume toggle and a delete button (with confirmation).

### 4.5 New & Modified Files for Recurring

```
NEW FILES:
  lib/recurrence.ts                             — getNextDueDate, checkDueRecurrences, generateFromRule
  hooks/use-recurring.ts                        — CRUD for recurring_rules + due-check on mount
  components/layout/RecurringBanner.tsx          — sticky banner for due recurrences
  components/recurring/RecurringPicker.tsx       — frequency/anchor/end chip selector for forms
  components/recurring/RecurringReviewSheet.tsx  — review & confirm pending entries

MODIFIED FILES:
  components/expenses/ExpenseForm.tsx            — add Repeat field in advanced section
  components/investments/ValuationForm.tsx       — add Repeat field in advanced section
  app/(main)/settings/page.tsx                  — recurring rules management section
  app/(main)/layout.tsx                         — mount RecurringBanner
  lib/supabase/types.ts                         — RecurringRule row type
  hooks/use-delete-account.ts                   — add recurring_rules to deletion order
```

### 4.6 Delete Account Update

The deletion order in §3 gains one more table at the top:

1. `recurring_rules WHERE workspace = ?`
2. `investment_valuations WHERE workspace = ?`
3. `investments WHERE workspace = ?`
4. `settlements WHERE workspace = ?`
5. `expenses WHERE workspace = ?`
6. `groups WHERE workspace = ?`
7. `settings WHERE workspace = ?`

"Clear all data" in danger zone also deletes `recurring_rules`.

---

## Updated Roadmap (additions only)

- SIP tracker: mark investment as SIP with monthly amount, auto-remind to log valuation → **partially addressed by recurring valuations in v2; SIP-specific UX (auto-increment principal on each installment) is still a future enhancement**
- Goal tracking: target value per investment with progress bar
- Benchmark comparison: manually enter Nifty 50 / FD rate for relative performance
- Multi-currency investments with manual INR conversion
- Import valuations from CSV (bulk-upload monthly NAVs)
- Investment tags/labels (e.g. "long-term", "tax-saver") for filtering
- Consolidated net worth view: portfolio value minus outstanding settlements