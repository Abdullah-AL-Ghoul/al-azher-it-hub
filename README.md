# AL-Azher IT Hub

Educational platform for Al-Azhar University IT students — video lectures, learning sources, study plans, and progress tracking in one bilingual (Arabic/English) app.

**Live:** https://al-azher-it-hub.vercel.app

## Features

- Video lectures organized by subject, with favorites, ratings, and view tracking
- Curated learning sources (PDFs, summaries, external links)
- Weekly study plan and academic course roadmap
- Announcements with comments, student activity logs, and notifications
- Admin dashboard: full CRUD, user management, activity and student logs
- Bilingual UI (Arabic RTL / English) with browser-language detection; light/dark/AMOLED themes following the OS preference
- Global search, PWA service worker with offline caching, SEO metadata per route

## Tech Stack

- **Frontend:** React 18, Vite 7, Tailwind CSS 3, Framer Motion, React Router 7
- **Backend:** Supabase (PostgreSQL, Auth, Storage) with row-level security
- **Testing:** Vitest (unit + coverage gates), Playwright (E2E), ESLint
- **Deployment:** Vercel

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint:check` | ESLint (js + jsx) |
| `npm test` | Vitest watch mode |
| `npm run test:coverage` | Unit tests with coverage gates |
| `npm run test:e2e` | Playwright E2E suite |

## Database

SQL migrations live in `supabase/`. Apply them to the Supabase project in the order documented in `docs/SECURITY_MIGRATION_CHECKLIST.md` (live-RLS fix first, then the hardening migration), then verify with the post-apply queries in the same file.

## Documentation

- `docs/AUDIT_REPORT.md` — full security, performance, a11y, and SEO audit
- `docs/SECURITY_MIGRATION_CHECKLIST.md` — migration apply order and verification
- `docs/DEPLOY_AND_MIGRATE_GUIDE_AR.md` — Arabic deployment and migration guide
