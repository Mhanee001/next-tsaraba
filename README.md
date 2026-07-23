# TSARABA

Inventory & production management system for small to medium manufacturing businesses.

## Features

- **Materials Management** — Track raw materials with stock levels and supplier info
- **Production Orders** — Create and manage production batches
- **Sales & Invoicing** — Customer orders, invoices, and payment tracking
- **Cash Flow** — Monitor income and expenses
- **Agent Management** — Workforce and labor tracking
- **Pro Forma Invoices** — Generate quotes and estimates
- **Expense Tracking** — Log and categorize operational expenses
- **Reconciliation** — Match payments to invoices
- **Ingredient Usage** — Track material consumption per production run
- **Printing Orders** — Manage print-specific production workflows
- **Audit Log** — Full change history for compliance

## Tech Stack

- **Framework:** TanStack Start (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Routing:** TanStack Router

## Getting Started

```sh
git clone <repo-url>
cd tsaraba
npm i
npm run dev
```

## Project Structure

```
src/
├── components/         # Shared UI components
├── integrations/       # External service integrations (Supabase)
├── lib/                # Utility functions and helpers
├── routes/             # TanStack Router route files
└── routeTree.gen.ts    # Auto-generated route tree
supabase/
└── migrations/         # Database migrations
```
