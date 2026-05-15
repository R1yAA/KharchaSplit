# KharchaSplit

Mobile-first PWA for tracking personal and group expenses in INR. Splitwise-style settlement minimization, multi-payer support, analytics, CSV export.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + Radix UI primitives (custom shadcn-style components)
- **Supabase** — Postgres backend
- **TanStack Query** — server state
- **Recharts** — analytics
- **Framer Motion + lucide-react** — animation + icons

## Getting started

### 1. Supabase

1. Open your Supabase project → **SQL Editor**.
2. Paste `supabase/migrations/0001_init.sql` and run it.
3. **Settings → API** → copy *Project URL* and *anon* key.

### 2. Env vars

```bash
cp .env.local.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run typecheck    # tsc --noEmit
```

### 4. Deploy

- Push to GitHub.
- In Vercel: import the repo, add the same two env vars, deploy.
- On iPhone Safari → **Share → Add to Home Screen** for PWA mode.

## Project structure

```
app/
  layout.tsx             # root + providers + PWA meta
  providers.tsx          # React Query + WorkspaceProvider + ToastProvider
  login/page.tsx         # username-only login
  (main)/                # authenticated routes with bottom tabs
    layout.tsx
    page.tsx             # Groups list (home)
    group/[id]/
      page.tsx           # Group detail (expenses + settlement summary)
      settle/page.tsx    # Settle Up breakdown
    personal/page.tsx    # Personal expenses (day-grouped)
    analytics/page.tsx   # 4 charts + filters
    settings/page.tsx    # Profile, export, danger zone

components/
  layout/                # BottomTabs, Fab, PageHeader
  ui/                    # Button, Input, Sheet, Dialog, Card, EmptyState, Skeleton, Toast
  workspace/             # WorkspaceProvider (username = workspace key)
  groups/                # GroupForm, GroupCard
  expenses/              # ExpenseForm, ExpenseListItem

hooks/                   # use-groups, use-expenses, use-settlements, use-settings

lib/
  supabase/              # client + Row types
  settlement.ts          # computeBalances + minimizeTransfers (greedy)
  format.ts              # Indian INR / date formatters
  csv.ts                 # CSV builders + browser download
  categories.ts          # Default categories + group icons
  utils.ts               # cn() — tailwind-merge

supabase/migrations/
  0001_init.sql          # schema, indexes, RLS, triggers

public/
  manifest.json
  icons/                 # add 192/512 PNGs here
```

## Workspace model

KharchaSplit has no auth in v1. The user enters a name on `/login`; that name is stored in `localStorage` as the *workspace key*. Every row in `groups`, `expenses`, `settlements`, and `settings` carries a `workspace` column scoped to that username, giving each user an isolated dataset. To swap users: Settings → Log out.

When adding real auth (Supabase Auth), tighten RLS in `0001_init.sql` to compare `workspace` with `auth.uid()` / a profile claim.

## Settlement algorithm

`lib/settlement.ts`:

1. `computeBalances(expenses, members)` — for each expense, credit the payer(s) and debit the split members. Supports multi-payer arrays and unequal splits.
2. `minimizeTransfers(balances)` — greedy: match the largest creditor with the largest debtor, repeat. Outputs the minimal list of (from → to, ₹).

## Roadmap (next)

- Swipe-to-delete gestures (instead of tap-to-reveal)
- Framer Motion page transitions
- Service worker for offline shell
- Recurring expenses
- Real auth + tightened RLS
