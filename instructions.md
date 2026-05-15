# KharchaSplit — Project Spec

A mobile-first, dark-themed PWA for tracking personal and group expenses in Indian Rupees. Splitwise-style settlement minimization, multi-payer support, analytics, CSV export. Designed for a small set of users (≤20) sharing one Supabase instance.

---

## 1. Product

- **Goal:** Fast, friction-free expense logging for one person at a time, with group splits and personal tracking in the same app.
- **Currency:** Indian Rupee (₹) only. All amounts formatted with `Intl.NumberFormat("en-IN")` → `₹1,23,456.00`.
- **Platform:** Progressive Web App. Works in mobile Safari/Chrome and installable to the iOS home screen for an app-like experience.
- **Auth model:** No passwords, no Supabase Auth in v1. Users type a name on `/login`; that name (stored in `localStorage` under `kharcha.workspace`) becomes their *workspace key*. Every DB row carries a `workspace` column, so two users on the same device see fully isolated data — log out of one, log in as another. There is intentionally **no `users` table**: the username string itself is the identity.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS with custom dark palette |
| UI primitives | Radix UI + custom shadcn-style components |
| Data | Supabase (Postgres) via `@supabase/supabase-js` |
| Server state | TanStack Query |
| Charts | Recharts |
| Icons | lucide-react |
| Hosting | Vercel |

---

## 3. Design System

### Dark theme (default and only)
| Token | Hex | Use |
|---|---|---|
| `bg` | `#0B0B10` | Page background |
| `surface` | `#16161D` | Cards, headers, sheet |
| `elevated` | `#1F1F28` | Chips, hover, secondary buttons |
| `line` | `#2A2A36` | Borders, dividers |
| `fg` | `#F5F5F7` | Primary text |
| `fg-muted` | `#A1A1AA` | Secondary text |
| `fg-dim` | `#6B7280` | Placeholders, tertiary text |
| `brand` | `#8BAE66` | Sage green accent — FAB, active tab, primary buttons, settlement amounts |
| `success` | `#22C55E` | Positive balances ("is owed") |
| `danger` | `#EF4444` | Negative balances, destructive actions |

### PWA chrome
- Manifest `theme_color` and `background_color` both `#0B0B10`.
- Apple status bar style: `black-translucent`.
- Viewport: `viewport-fit=cover`, `width=device-width`, `initial-scale=1`.

### UX rules
1. **Zero-friction expense entry.** Amount → who paid → split → done in under 10 seconds. Note/extra fields are hidden behind a *Show advanced* toggle.
2. **No sign-up wall.** App opens to `/login` (one-field username), then directly to Groups.
3. **Big sage FAB.** Floating action button bottom-right, 56px, always means "add something" on the current screen.
4. **Bottom tabs:** `Groups | Personal | Analytics | Settings`.
5. **Settlement is the hero.** "Who owes whom" lives at the top of every group, not in a menu.
6. **Big amounts.** Expense amounts use large, bold typography with ₹ prefix.
7. **Confirm before destruction.** Deleting a group, expense, or "Clear all data" requires a confirmation dialog (clear-all also requires typing `DELETE`).
8. **Empty states.** Every empty list has a friendly emoji + CTA. Groups list uses the kawaii kitty 🐱.

---

## 4. Screens

### `/login`
Username-only form. Stores the name as the active workspace key.

### `/` — Groups list
Cards with group icon, name, member count, total spend, last activity. Tap → group detail. FAB → create-group sheet.

### Create / Edit Group (bottom sheet)
- **Name** (max 100 chars, required)
- **Icon** — 12 preset emojis (🏖 🏠 🍕 ✈️ 🎉 🏕 🚗 💼 🎓 ❤️ 🛒 🎮) **plus a free emoji input tile** for any custom emoji
- **Members** — chip list with add/remove (≥1 required, no case-insensitive duplicates)

### `/group/[id]` — Group detail
- **Settlement summary card** (top, always visible) — minimized transfers ("A owes B ₹X") + "Settle Up" button
- **Per-member balance chips** — horizontal scroll; green for positive, red for negative
- **Expense list** — category emoji, title, payer, split summary, date, amount
- **Overflow menu** — Edit Group, Export CSV, Delete Group
- **FAB** → add-expense sheet

### Add / Edit Expense (bottom sheet)
- **Amount** (auto-focused, large numeric input)
- **Title** (required, max 100 chars)
- **Category** — built-in chips + a **+ Add** chip to create custom categories (see §5)
- **Paid by** — single-payer chip select, OR toggle **Multiple payers** for checkbox + per-payer amount inputs (must sum to total)
- **Split between** — checkbox per member, then Equal | Unequal toggle. Unequal mode shows per-member amount inputs with a live "Remaining" indicator that turns red when sums don't match
- **Date** (defaults to today)
- **Advanced toggle** → optional note

Personal expenses use the same form with `isPersonal` flag — no payer/split fields shown.

### `/group/[id]/settle` — Settle Up
- Total group spend
- Per-member balance bars (sized proportionally to abs balance; green if owed, red if owes)
- Suggested transfers — each row shows `From → To ₹Amount` with a **Mark Paid** toggle that persists in the `settlements` table

### `/personal` — Personal expenses
- This-month total card
- Day-grouped list ("Today", "Yesterday", then `D Mon YYYY")
- FAB → simplified add-expense sheet (no payer/split)

### `/analytics`
Two filters at the top (sticky): **Period** (Week / Month / 3 Months / Year / All) × **Scope** (All / Personal Only / specific group).

Four charts:
1. **Category Breakdown** — Recharts donut + legend with totals
2. **Group Comparison** — horizontal bar chart, one bar per group + a "Personal" bar
3. **Per Person Spend** — vertical bar chart, only rendered when scope is a specific group
4. **Monthly Trend** — line chart over the last 6 months

### `/settings`
- **Your name** — editable, persisted to `settings.user_name`
- **Currency** — read-only (₹)
- **Export all data** — generates a single CSV with `Group, Date, Title, Category, Amount, Paid By, Split Type, Split Between, Note` (Group blank for personal rows)
- **About** — version + credit
- **Danger zone** — Clear all data (requires typing `DELETE`), Log out

---

## 5. Custom categories & icons

**Custom expense categories.** End of the category chip row has a dashed **+ Add** chip. Tap it → inline mini-form (emoji + name). Saving persists to `localStorage` under `kharcha.customCategories` and auto-selects the new category. Custom chips show an × to remove (built-ins cannot be removed). `lib/categories.ts:categoryById()` resolves both built-in and custom IDs, so expense rows tagged with a since-removed custom category still render gracefully.

**Custom group icons.** The icon grid in the group form includes a free emoji input tile alongside the 12 presets. Group `icon` is a free-form `varchar(10)` in the schema, so no DB change is needed.

**Built-in categories:**
| Emoji | Name |
|---|---|
| 🍕 | Food & Drinks |
| 🚕 | Transport |
| 🏨 | Accommodation |
| 🛒 | Shopping |
| 🎮 | Entertainment |
| 💊 | Health |
| 📱 | Utilities |
| 📦 | Other |

---

## 6. Data Model

Canonical schema: `supabase/migrations/0001_init.sql`. Every table has `workspace TEXT NOT NULL` for app-layer multi-user isolation.

### `groups`
```sql
id           UUID PK
workspace    TEXT NOT NULL
name         VARCHAR(100) NOT NULL
icon         VARCHAR(10) DEFAULT '📦'
members      TEXT[] NOT NULL DEFAULT '{}'
created_at   TIMESTAMPTZ DEFAULT NOW()
updated_at   TIMESTAMPTZ DEFAULT NOW()
```

### `expenses`
```sql
id                UUID PK
workspace         TEXT NOT NULL
group_id          UUID REFERENCES groups(id) ON DELETE CASCADE  -- NULL for personal
title             VARCHAR(100) NOT NULL
amount            DECIMAL(12,2) NOT NULL CHECK (amount > 0)
category          VARCHAR(30) NOT NULL DEFAULT 'other'          -- built-in id OR custom-<timestamp>
paid_by           VARCHAR(50)                                   -- single-payer (legacy/fallback)
paid_by_members   TEXT[]            DEFAULT '{}'                -- multi-payer
paid_by_amounts   DECIMAL(12,2)[]   DEFAULT '{}'                -- parallel to paid_by_members
split_type        VARCHAR(10) CHECK (split_type IN ('equal','unequal'))
split_members     TEXT[]            DEFAULT '{}'
split_amounts     DECIMAL(12,2)[]   DEFAULT '{}'
date              DATE NOT NULL DEFAULT CURRENT_DATE
note              TEXT
is_personal       BOOLEAN DEFAULT FALSE
created_at        TIMESTAMPTZ DEFAULT NOW()
updated_at        TIMESTAMPTZ DEFAULT NOW()
```

### `settlements`
```sql
id            UUID PK
workspace     TEXT NOT NULL
group_id      UUID REFERENCES groups(id) ON DELETE CASCADE
from_member   VARCHAR(50) NOT NULL
to_member     VARCHAR(50) NOT NULL
amount        DECIMAL(12,2) NOT NULL
is_paid       BOOLEAN DEFAULT FALSE
paid_at       TIMESTAMPTZ
created_at    TIMESTAMPTZ DEFAULT NOW()
```

### `settings`
```sql
workspace     TEXT PRIMARY KEY            -- one row per workspace
user_name     VARCHAR(50) DEFAULT 'Me'
created_at    TIMESTAMPTZ DEFAULT NOW()
updated_at    TIMESTAMPTZ DEFAULT NOW()
```

### Indexes
On `workspace` for all four tables, plus `expenses(group_id)`, `expenses(date DESC)`, `expenses(workspace, is_personal) WHERE is_personal`, `expenses(category)`, `settlements(group_id)`.

### RLS (v1)
All four tables have RLS enabled with permissive `using (true) with check (true)` policies for the `anon` role. **This is acceptable for a 20-user personal app; not safe for public deployment.** Upgrade path: enable Supabase Auth, add a `profiles` table mapping `auth.uid()` → workspace, replace the policies with `workspace = (select workspace from profiles where id = auth.uid())`.

`updated_at` is maintained by a `touch_updated_at()` trigger on `groups`, `expenses`, and `settings`.

---

## 7. Settlement Algorithm

`lib/settlement.ts`:

1. **`computeBalances(expenses, members)`** — for each expense, credit payer(s) and debit split members. Honors multi-payer parallel arrays and unequal splits. Returns `[{ member, net }]` rounded to 2 decimals.
2. **`minimizeTransfers(balances)`** — greedy min-transfers: sort creditors descending and debtors ascending (by abs value), match the largest of each, transfer `min(creditor, |debtor|)`, repeat until both lists are empty. Outputs the minimal list of `{ from, to, amount }`.

---

## 8. Project Structure

```
app/
  layout.tsx              # root + PWA meta
  providers.tsx           # React Query + WorkspaceProvider + ToastProvider
  globals.css             # dark theme tokens
  login/page.tsx          # username-only login
  (main)/                 # authenticated routes (bottom tabs)
    layout.tsx
    page.tsx              # Groups list
    group/[id]/page.tsx           # Group detail
    group/[id]/settle/page.tsx    # Settle Up
    personal/page.tsx
    analytics/page.tsx
    settings/page.tsx

components/
  layout/        # BottomTabs, Fab, PageHeader
  ui/            # Button, Input, Sheet, Dialog, Card, EmptyState, Skeleton, Toast
  workspace/     # WorkspaceProvider (username = workspace key)
  groups/        # GroupForm, GroupCard
  expenses/      # ExpenseForm, ExpenseListItem, CategoryPicker

hooks/
  use-groups.ts             # CRUD over groups, workspace-scoped
  use-expenses.ts           # group / personal / all + upsert + delete
  use-settlements.ts        # mark paid persistence
  use-settings.ts           # auto-creates a settings row on first read
  use-custom-categories.ts  # localStorage-backed custom categories

lib/
  supabase/client.ts        # createClient (untyped — row shapes in types.ts)
  supabase/types.ts         # Row interfaces for all four tables
  settlement.ts             # computeBalances + minimizeTransfers
  format.ts                 # INR + Indian date formatters
  csv.ts                    # CSV builders + browser download
  categories.ts             # DEFAULT_CATEGORIES + GROUP_ICONS + categoryById (resolves customs)
  utils.ts                  # cn() — tailwind-merge

supabase/migrations/
  0001_init.sql             # tables, indexes, triggers, RLS

public/
  manifest.json
  icons/                    # add 192/512 PNGs here
```

---

## 9. Setup & Deploy

### Supabase
1. Open your Supabase project → SQL Editor → paste `supabase/migrations/0001_init.sql` → Run.
2. Project Settings → API → copy **Project URL** + **anon public key**.

### Local
```bash
cp .env.local.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run typecheck
```

### Vercel
Import the GitHub repo, add the same two env vars in Project Settings → Environment Variables, deploy.

### PWA
Drop `icon-192.png` and `icon-512.png` into `public/icons/`. On iPhone Safari: **Share → Add to Home Screen**.

---

## 10. Roadmap

- Swipe-to-delete gestures (instead of tap-to-reveal)
- Framer Motion page transitions
- Service worker for offline shell
- Recurring expenses
- Real Supabase Auth + tightened RLS
- Sync custom categories to Supabase instead of localStorage (so they follow the workspace across devices)
