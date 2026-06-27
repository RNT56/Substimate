<div align="center">
  <img src="public/substimate_logo.svg" alt="Substimate logo" width="96" height="96" />

  <h1>Substimate</h1>

  <p><strong>A private-first finance workspace for subscriptions, spending, assets, income, and currency-aware planning.</strong></p>

  <p>
    <a href="https://react.dev/"><img alt="React 19" src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" /></a>
    <a href="https://www.typescriptlang.org/"><img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript&logoColor=white" /></a>
    <a href="https://vite.dev/"><img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white" /></a>
    <a href="https://supabase.com/"><img alt="Supabase Postgres" src="https://img.shields.io/badge/Supabase-Postgres-3fcf8e?style=flat-square&logo=supabase&logoColor=white" /></a>
  </p>
</div>

---

## Overview

Substimate is a React and Supabase application for tracking recurring subscriptions and personal finance data from one dashboard. It combines subscription management, cost analytics, asset tracking, income planning, and currency conversion into a responsive interface designed for day-to-day financial awareness.

The project is built as a client application backed by Supabase Auth, Postgres, Row Level Security, and database migrations.

## Highlights

- Subscription tracking with categories, payment methods, billing periods, favorites, and usage state.
- Price history support for subscription changes over time.
- Finance dashboard for assets, income sources, fixed expenses, variable expenses, and transactions.
- Cost tracker views with category distribution, monthly trends, and spending flow charts.
- Payday calendar for upcoming income and recurring payment awareness.
- Currency preferences for EUR, USD, and BTC display modes.
- Theme system with multiple visual styles and dark mode support.
- Responsive desktop and mobile layouts.

## Product Surface

| Area | Purpose |
| --- | --- |
| Subscriptions | Add, edit, delete, reorder, favorite, and analyze recurring subscriptions. |
| Analytics | Review monthly trends, category distribution, lifetime costs, and usage statistics. |
| Finance | Track assets, transactions, income, and expenses. |
| Cost Tracker | Compare income against recurring and variable expenses. |
| Payday Calendar | See incoming payments and scheduled recurring costs. |
| Calculator | Convert fiat values into Bitcoin satoshis using live market data. |
| Settings | Manage theme, visual style, and currency preferences. |

## Tech Stack

| Layer | Tools |
| --- | --- |
| Application | React 19, TypeScript 6, React Router 7 |
| Build | Vite 8, Tailwind CSS 3, PostCSS |
| Data | Supabase, PostgreSQL, Row Level Security |
| Auth | Supabase Auth |
| Charts | Recharts 3, D3 Sankey |
| Interaction | DnD Kit, Lucide React |
| Quality | ESLint, npm audit, Vite production build |

## Architecture

```text
src/
  components/        Reusable UI, dashboards, cards, modals, charts
  contexts/          Auth, currency, subscription, theme, and toast providers
  hooks/             Data and analytics hooks
  lib/               Supabase client, constants, market-data helpers, DB types
  pages/             Route-level pages
  styles/            Visual style themes
  utils/             Subscription prediction and reference data

supabase/
  migrations/        Database schema, RLS policies, triggers, and hardened RPCs
```

## Getting Started

### Requirements

- Node.js 22.13 or newer
- npm 11 or newer
- A Supabase project
- Supabase CLI if you want to apply the migrations locally or to a hosted project

### Installation

```bash
git clone https://github.com/RNT56/Substimate.git
cd Substimate
npm install
```

### Environment

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Set the public Supabase client values:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Only public browser-safe Supabase values belong in this file. Do not add service-role keys, private API keys, database passwords, or provider secrets to any `VITE_*` variable.

### Database

Apply the migrations to your Supabase project:

```bash
supabase db push
```

The migrations define the application tables, indexes, RLS policies, triggers, and public-safe RPC helpers. User-owned data is scoped through Supabase Auth and Row Level Security.

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint across the codebase. |
| `npm audit` | Check dependency advisories. |

## Security Notes

- `.env` and `.env.*` are ignored by Git.
- `.env.example` is the only environment file intended for source control.
- Supabase service-role keys must never be used in the browser.
- Client-side market data calls use public endpoints without committed provider secrets.
- Database access should remain mediated by RLS policies and hardened RPC functions that derive ownership from `auth.uid()`.
- GitHub secret scanning and push protection are enabled for the public repository.

## Public Repository Status

The public branch is intentionally minimal:

- Default branch: `main`
- Historical secret-bearing env files removed from reachable history
- No open GitHub Dependabot alerts at the time of the public cleanup
- No open GitHub secret-scanning alerts at the time of the public cleanup

## Roadmap

- Add export workflows for recurring costs and finance records.
- Expand reporting for long-term cash flow and savings scenarios.
- Add optional backend or edge functions for provider integrations that require private keys.
- Plan the Tailwind CSS 4 migration as a dedicated visual-system pass.
- Add focused test coverage around import parsing, currency conversion, and Supabase data transforms.

## License

No license has been declared yet. Add a license before accepting external contributions or reuse.
