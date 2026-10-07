# VISTA PRESENTS: THE VERDICT
## High-Stakes Event Simulation Platform

> **"I'm not filling out a registration form. I'm entering the simulation."**

A luxury editorial, cinematic, high-stakes simulation platform built for **VISTA: THE VERDICT** hosted at **APJ Block, NMAMIT (16–17 October)**.

---

## 🏛️ The Three Simulation Arenas

1. **01 — BOLLYWOOD SAGA**
   - *Hook*: "Build India's next billion-dollar blockbuster."
   - *Format*: `INDIVIDUAL`
   - *Pricing*: ISE Student Fee: ₹250 | Non-ISE Standard Fee: ₹350
2. **02 — IPL MEGA AUCTION 2027**
   - *Hook*: "Build your franchise. Outbid everyone."
   - *Format*: `TEAM — 2–3 MEMBERS` (Primary registrant becomes Team Lead)
   - *Pricing*: Team Fee — ISE: ₹600 | Non-ISE: ₹750
3. **03 — LOK SABHA**
   - *Hook*: "Power. Policy. Politics."
   - *Format*: `INDIVIDUAL`
   - *Pricing*: ISE Student Fee: ₹250 | Non-ISE Standard Fee: ₹350

---

## ⚙️ Core Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend / Database**: Supabase (PostgreSQL with Row Level Security, Sequences, RPC functions for assignment & pricing, Storage buckets).
- **Pricing Engine**: Dynamic category resolution table (`registration_fee_rules`) resolving ISE vs NON_ISE delegates with server-side price snapshots.
- **Assignment Engine**: Server-side 3-preference algorithmic allocation engine with fair randomized tie-breaking and automatic capacity balancing.
- **Reveal Portal**: Suspenseful cinematic role reveal experience with audio synthesizer and confetti fanfare.
- **Export Engine**: Excel (`.xlsx`) & CSV export for Master Registrations, Confirmed Delegates, Payment Ledgers, Portfolio Assignments, and IPL Franchise Teams.
- **Notifications**: Transactional Email (Resend) and WhatsApp Cloud API / Twilio adapters with development simulation fallback.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

> **Note**: The application comes pre-loaded with an in-memory, persistent simulation engine. You can immediately register delegates, form IPL teams, test UTR payments, verify transactions in High Command Admin, run the assignment engine, and experience cinematic reveals without needing external credentials configured!

---

## 🗄️ Supabase Production Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Paste and run the entire contents of `supabase/schema.sql`.
   - Creates all tables (`committees`, `portfolios`, `registration_fee_rules`, `registrations`, `payments`, `assignments`, `reveals`, etc.)
   - Creates sequences for `THEV-XXXXX` and `THEV-IPL-XXXXX`
   - Installs the PostgreSQL assignment engine function `run_portfolio_assignment()`
   - Enables Row Level Security (RLS) policies
   - Inserts seed data for all 3 simulation arenas and portfolios.
4. Configure Supabase Google OAuth in **Authentication -> Providers -> Google**.
5. Set your `.env` variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## 🧭 Application Structure

### Public Experiences
- `/` — Landing Page with arena dossiers and countdown telemetry.
- `/register` — 4-Stage cinematic registration wizard:
  - `01 — CHOOSE YOUR BATTLE`
  - `02 — CLAIM YOUR ROLE` (Rank exactly 3 distinct portfolios via drag & drop or tap)
  - `03 — ENTER THE ARENA` (Individual or IPL Team 2–3 members with real-time branch category detection)
  - `04 — SECURE YOUR ENTRY` (Dynamic category fee, QR code, UTR, and screenshot upload)
- `/login` — Google Authentication with instant testing role switch.
- `/dashboard` — Delegate Dossier with locked preferences, payment status, credentials editor (locked once confirmed), and revealed portfolio.
- `/reveal` — Suspenseful cinematic role declassification portal.

### High Command Admin Console (`/admin`)
- `/admin` (Overview) — Operational metrics, capacity meters, and arena breakdown.
- `/admin/registrations` — Full registration table, search, filters, and detail drawer.
- `/admin/payments` — Payment verification queue with screenshot inspection viewer.
- `/admin/committees` — Arena configuration and Category Pricing Rule Management (ISE vs Non-ISE).
- `/admin/portfolios` — Role capacities, quota limits, and active toggles.
- `/admin/assignments` — Algorithmic auto assignment engine, re-runs, resets, and manual overrides.
- `/admin/reveals` — Individual and bulk committee role unsealing (Cinematic or Simple mode).
- `/admin/exports` — 1-click Excel/CSV exports for 6 distinct operational ledgers.
- `/admin/settings` — Admission gate toggle, QR code image URL, notification status, and audit log history.

---

## 🚢 Deploying to Vercel

```bash
npm run build
```
Deploy to Vercel with standard Vite framework preset. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Project Settings.
