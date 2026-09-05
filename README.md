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

- **Frontend:** React 18, Vite 7, Tailwind CSS 3, Framer Motion, React Router 7, three.js (lazy 3D scenes)
- **Backend:** Supabase (PostgreSQL, Auth, Storage) with row-level security and SECURITY DEFINER RPCs
- **Testing:** Vitest (214 unit tests + coverage gates), Playwright (28 E2E + axe accessibility scans), Lighthouse CI budgets
- **Deployment:** Vercel

## Documentation

| Document | Contents |
|---|---|
| [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md) | Full technical reference: architecture, stack, routes, components, database schema, security analysis, developer guide |
| [`docs/SECURITY_MIGRATION_CHECKLIST.md`](docs/SECURITY_MIGRATION_CHECKLIST.md) | How to apply the Supabase SQL migrations, in order, with verification queries |
| [`supabase/`](supabase/) | The SQL migrations themselves (idempotent, applied in order via the Supabase SQL Editor) |

## Project Layout

```
src/
├── components/    # Navbar, cards, admin dashboard, shared primitives, 3D scenes
├── pages/         # 15 route pages (React.lazy)
├── context/       # Auth, Language, Theme, UserData providers
├── hooks/         # useLectures, useSeo, useScrollManager, useFocusTrap, ...
├── services/      # the only layer that talks to Supabase
├── utils/         # helpers, crypto (PBKDF2), sanitize, motion tokens
└── i18n/          # ar.json / en.json dictionaries (parity-kept)
public/            # SW, fonts, manifest, robots, sitemap
supabase/          # SQL migrations (applied manually in Supabase SQL Editor)
e2e/               # Playwright specs
.github/workflows/ # CI: lint → tests → build → E2E → Lighthouse → audit
```

## License

MIT — see the repository metadata.
