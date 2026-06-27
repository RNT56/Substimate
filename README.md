<div align="center">
  <img src="public/substimate_logo.svg" alt="Substimate logo" width="104" height="104" />

  <h1>Substimate</h1>

  <p><strong>A private-first finance workspace for subscriptions, spending, assets, income, and currency-aware planning.</strong></p>

  <p>
    <a href="https://github.com/RNT56/Substimate/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/RNT56/Substimate/ci.yml?branch=main&style=flat-square&label=CI" /></a>
    <a href="https://react.dev/"><img alt="React 19" src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" /></a>
    <a href="https://www.typescriptlang.org/"><img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript&logoColor=white" /></a>
    <a href="https://vite.dev/"><img alt="Vite 8" src="https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite&logoColor=white" /></a>
    <a href="https://tailwindcss.com/"><img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" /></a>
    <a href="https://supabase.com/"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3fcf8e?style=flat-square&logo=supabase&logoColor=white" /></a>
  </p>

  <p>
    <a href="#overview">Overview</a> |
    <a href="#features">Features</a> |
    <a href="#tech-stack">Tech Stack</a> |
    <a href="#getting-started">Getting Started</a> |
    <a href="#security">Security</a>
  </p>
</div>

---

## Overview

Substimate is a React and Supabase application for managing recurring subscriptions and personal finance data from one responsive dashboard. It brings subscription tracking, cost analytics, asset management, income planning, expense awareness, and currency display modes into a single product surface.

The app is designed as a public portfolio project with a production-style client stack, Supabase Auth, Postgres migrations, Row Level Security, hardened RPC functions, dependency auditing, and secret scanning in CI.

## Product Value

- See recurring subscriptions, payment methods, billing periods, categories, usage state, and favorites in one place.
- Understand monthly cost, lifetime spend, category distribution, and recent subscription trends.
- Track broader finance context with assets, income sources, fixed expenses, variable expenses, and transactions.
- Review upcoming income and recurring payment timing through a payday calendar.
- Import subscriptions from CSV with validation and preview before write.
- Switch display preferences across EUR, USD, and BTC-oriented views.
- Customize the interface with dark mode and multiple visual styles.

## Features

| Area | What It Does |
| --- | --- |
| Subscriptions | Add, edit, delete, reorder, favorite, categorize, and analyze recurring services. |
| Price History | Preserve historical subscription cost changes for long-term reporting. |
| Analytics | Show monthly trends, category distribution, lifetime costs, usage statistics, and payment-method summaries. |
| Finance | Track assets, income sources, fixed expenses, variable expenses, and transactions. |
| Cost Tracker | Compare recurring and variable costs against income over selected periods. |
| Payday Calendar | Surface income timing and upcoming subscription payment dates. |
| Import | Parse CSV subscription data, validate rows, preview errors, and import valid entries. |
| Calculator | Convert fiat values into Bitcoin satoshis using public market data. |
| Settings | Manage theme, visual style, and currency preferences. |

## Tech Stack

| Layer | Tools |
| --- | --- |
| Application | React 19, TypeScript 6, React Router 7 |
| Build | Vite 8, Tailwind CSS 4, `@tailwindcss/vite` |
| Data | Supabase, PostgreSQL, Row Level Security |
| Auth | Supabase Auth |
| Charts | Recharts 3, D3 Sankey |
| Interaction | DnD Kit, Lucide React |
| Quality | ESLint, TypeScript build checks, npm audit, Gitleaks |

## Architecture

```text
src/
  components/        Reusable UI, dashboards, cards, modals, charts
  contexts/          Auth, currency, subscription, theme, and toast providers
  hooks/             Data and analytics hooks
  lib/               Supabase client, constants, market-data helpers, DB types
  pages/             Route-level product pages
  styles/            Visual style themes and CSS variable palettes
  utils/             Subscription prediction and reference data

supabase/
  migrations/        Database schema, RLS policies, triggers, and hardened RPCs

.github/
  workflows/         CI for install, lint, typecheck, build, audit, and secret scan
```

## Getting Started

### Requirements

- Node.js 22.13 or newer
- npm 11 or newer
- A Supabase project
- Supabase CLI if you want to apply migrations from this repo

### Install

```bash
git clone https://github.com/RNT56/Substimate.git
cd Substimate
npm install
```

### Configure Environment

Create a local environment file:

```bash
cp .env.example .env
```

Set the public Supabase browser client values:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Only browser-safe Supabase values belong in `VITE_*` variables. Do not place service-role keys, database passwords, provider secrets, or private API keys in the client environment.

### Apply Database Migrations

```bash
supabase db push
```

The migrations create application tables, indexes, RLS policies, triggers, and RPC helpers. User-owned data is scoped through Supabase Auth and Row Level Security.

### Run Locally

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
| `npm run typecheck` | Run TypeScript project checks without emitting files. |
| `npm audit --audit-level=moderate` | Check dependency advisories at moderate severity and above. |

## Security

- `.env` and `.env.*` are ignored by Git.
- `.env.example` is the only environment file intended for source control.
- Supabase service-role keys must never be used in the browser.
- Client-side market data calls use public endpoints without committed provider secrets.
- Database access is mediated by RLS policies and RPC functions that derive ownership from `auth.uid()`.
- CI runs Gitleaks secret scanning on pushes and pull requests.
- GitHub secret scanning and push protection are enabled for the public repository.

## Quality Gates

The `main` branch is protected by a CI workflow that runs:

| Gate | Purpose |
| --- | --- |
| `npm ci` | Reproducible dependency install from `package-lock.json`. |
| `npm run lint` | Static linting for TypeScript and React code. |
| `npm run typecheck` | TypeScript project verification. |
| `npm run build` | Production Vite build. |
| `npm audit --audit-level=moderate` | Dependency advisory check. |
| Gitleaks | Secret scan for committed credentials and tokens. |

## Public Repository Status

- Default branch: `main`
- Public-safe `.env.example` included for local setup
- Tailwind CSS migrated to v4 through the Vite plugin
- React, Vite, React Router, Recharts, TypeScript, and related frontend tooling upgraded
- CI passing on `main`

## Roadmap

- Add export workflows for recurring costs and finance records.
- Expand reporting for long-term cash flow and savings scenarios.
- Add optional backend or edge functions for integrations that require private provider keys.
- Add focused test coverage around import parsing, currency conversion, and Supabase data transforms.
- Add first-party screenshots or a hosted demo once a stable public deployment is available.

## License

No license has been declared yet. The repository is source-available for portfolio review, but reuse, redistribution, or external contribution terms are not granted until a license is added.
