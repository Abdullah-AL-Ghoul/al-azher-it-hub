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


