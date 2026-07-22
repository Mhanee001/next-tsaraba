## Next Tsaraba Ops — Build Plan

A web app to replace the 96-tab Excel workbook with a normalized Supabase-backed system for Next Tsaraba Nigeria Ltd.

### Stack
- Frontend: React + TypeScript, TanStack Start (already scaffolded), Tailwind, shadcn/ui, lucide-react
- Backend: Lovable Cloud (Supabase) — Postgres, Auth, RLS
- Currency: Nigerian Naira (₦)

### Phase 1 — Foundation (this first build)
1. Enable Lovable Cloud.
2. Design system: warm, professional palette (deep blue + water-cyan accent, cream background), Inter/DM Sans typography, tokens in `styles.css`. Mobile-first.
3. Auth: email/password sign-in at `/auth`, protected app under `_authenticated/`. Profile row auto-created on signup; role defaults to `sales_clerk` (owner sets others).
4. Roles via separate `user_roles` table + `has_role()` security-definer function. Enum: `owner | production_staff | sales_clerk`.
5. Full schema + RLS + grants:
   - `profiles`, `user_roles`
   - `raw_materials`
   - `production_logs`
   - `agents`
   - `sales_records`
   - `expenses`
   - `cash_reconciliation`
   - `payroll_records`
6. App shell: sidebar nav, top bar, role-aware menu.
7. Dashboard skeleton with live counts (today's production, cash collected, outstanding credit, low stock).

### Phase 2 — Sales & Agents
- Agents CRUD (name, phone, commission %, running credit balance).
- Sales entry: fast form (date, type: agent/factory/walk-in, qty, unit price, damages, returns, cash vs credit). Auto-computes commission and updates agent credit.
- Agent ledger page `/agents/$id` with running balance, sales history, payments received.

### Phase 3 — Production & Inventory
- Production log: date + shift (morning/evening), bags produced, damages, carry-over, notes.
- Raw materials list + usage entry that decrements stock; low-stock warning threshold.

### Phase 4 — Cash, Expenses, Payroll
- Expenses CRUD with categories.
- Daily cash reconciliation view: auto-pulls production value, sales cash, credit issued, discounts, expenses → expected vs actual, variance highlighted red if mismatch.
- Payroll: daily staff wage entries with meal deduction, mark paid/unpaid.

### Phase 5 — Reports
- Weekly/monthly revenue, profit (revenue − expenses − wages − materials), top agents, material usage trend. Charts via recharts.

### Technical details
- Server-side reads/writes via `createServerFn` with `requireSupabaseAuth`; admin ops via `supabaseAdmin` inside handler dynamic import.
- All money stored as `numeric(14,2)`.
- Zod validation on every form and server fn `.inputValidator()`.
- Route architecture: `_authenticated/dashboard`, `/sales`, `/agents`, `/agents/$id`, `/production`, `/materials`, `/expenses`, `/reconciliation`, `/payroll`, `/reports`. Public `/` = landing + sign-in CTA; `/auth`.

### This first turn delivers
Phase 1 complete + Phase 2 (agents + sales entry + agent ledger) working end-to-end, so the business can start capturing real data immediately. Phases 3–5 in follow-up turns.

### Questions before I start
1. Confirm currency is Naira (₦) and default sachet unit is "bag" (of 20 sachets)?
2. Should new signups default to `sales_clerk` awaiting owner approval, or should the first user become `owner` automatically and subsequent users need owner invite?
3. Any specific brand colors/logo to use, or should I pick a clean water-industry palette?
