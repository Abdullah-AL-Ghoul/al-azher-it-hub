# AL-Azher IT Hub — Complete Technical Documentation

**Version:** 1.0.0 · **Last updated:** 2026-09-04 · **Live:** https://al-azher-it-hub.vercel.app
**Author / Maintainer:** Abdullah Al-Ghoul (abdallhalghoul200@gmail.com)
**Repository:** https://github.com/abdullahalghoul/al-azher-it-hub (MIT)

> This document is written from the actual codebase — every table, route, service, and component named here exists in the repository. It is the onboarding reference: a new developer should be able to understand, run, extend, and maintain the project from this file alone.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Architecture](#2-project-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Folder & File Structure](#4-folder--file-structure)
5. [Pages & Routes](#5-pages--routes)
6. [Components Architecture](#6-components-architecture)
7. [UI/UX Structure](#7-uiux-structure)
8. [State Management](#8-state-management)
9. [Database Structure](#9-database-structure)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [API & External Services](#11-api--external-services)
12. [Core Features](#12-core-features)
13. [Data Flow](#13-data-flow)
14. [Performance Analysis](#14-performance-analysis)
15. [Security Analysis](#15-security-analysis)
16. [SEO & Accessibility](#16-seo--accessibility)
17. [Testing](#17-testing)
18. [Deployment & Environment](#18-deployment--environment)
19. [Developer Guide: How to Extend](#19-developer-guide-how-to-extend)

---

## 1. Project Overview

| | |
|---|---|
| **Project name** | AL-Azher IT Hub |
| **Type** | Single-Page Application (SPA) — a bilingual web platform |
| **Objective** | Give IT students one organized place for all their course material: video lectures, subject sources (PDFs/slides), the study plan, and the course roadmap — in Arabic and English. |
| **Problem solved** | Course material is scattered across chat groups and random links. Students lose track of what they watched, what exists, and where files are. This platform centralizes it with per-student progress tracking. |
| **Target audience** | IT students (Arabic-first, with full English support); one admin (the platform owner) who manages all content. |
| **Current status** | Production, live on Vercel. Actively developed; a security-hardening migration for the database is **pending on the owner** (see §15). |

**Key functions provided**

- **Video lectures** organized by subject, with YouTube thumbnails, a quality-fallback ladder, inline playback (facade → `youtube-nocookie` iframe), and external-YouTube fallback.
- **Sources** (PDFs/images/archives/documents) uploaded to Supabase Storage by the admin, browsable and downloadable by students, filtered by subject.
- **Watch tracking**: per-student viewed-lectures list, favorites, and star ratings ("continue watching" strip).
- **Study plan & course roadmap** pages (content managed by the admin from the dashboard).
- **Additions** (posts/announcements) with student comments.
- **Admin dashboard**: CRUD over lectures/sources/additions/courses, user management, activity & student logs, DB backup/export.
- **Chatbot**: rule-based assistant (`buildChatIntents`) that answers questions about subjects/contacts/platform info — no external AI service.
- **Global search** (Ctrl+K) across lectures, sources, additions, and pages.
- **Bilingual (ar/en)** with RTL/LTR, and **light/dark/AMOLED** themes.

**Value to users:** everything for a course in one page — lecture video, its sources, its rating, whether it was watched.

**Strengths**

- Complete bilingual RTL/LTR implementation with centralized dictionaries (1,010 keys each) and parity checks.
- Real security architecture in SQL (SECURITY DEFINER RPCs, server-side identity derivation, throttling) — not just client checks.
- Production-quality infra: CSP + security headers, Service Worker with bounded caches, manual vendor chunking, per-route SEO.
- Test suite: 214 unit tests (Vitest) + 28 E2E (Playwright, desktop + mobile) + axe accessibility scans + Lighthouse budget in CI.

**Weaknesses (honest, verified)**

- **Critical (live):** `student_logs` and `activity` tables are readable by the anonymous key until the owner applies `supabase/migration-fix-live-rls.sql` (details + steps in §15).
- Several hardening RPCs (`mark_viewed`, `add_student_log`, `student_update_profile`) do not exist on the live DB yet — the hardening migration creates them; until applied, viewed-tracking and profile-update paths degrade or are missing server-side protection.
- Password hashing (PBKDF2 via Web Crypto) happens **client-side**; the hash is what the server stores/compares. Works, but the design is unusual and depends on the hash-compare RPCs.
- All content CRUD is admin-only but enforced by RLS policies on the DB; a mistake in live SQL can silently reopen paths (exactly what happened with the logs).
- No automated DB backups beyond Supabase defaults.

---

## 2. Project Architecture

**Overall shape:** a React SPA talking directly to Supabase (PostgreSQL via PostgREST + Auth + Storage). There is **no custom backend server** — "backend" logic lives in two places:

1. **Supabase SQL functions (RPCs)** — security-critical operations (login, register, profile update, favorites/ratings/viewed, throttling) run as `SECURITY DEFINER` functions in PostgreSQL, so identity is derived from the JWT **server-side**, never trusted from the client.
2. **Client services layer (`src/services/*`)** — typed wrappers around Supabase queries, the only place `getSupabase()` is called.

**Frontend architecture**

- React 18 + React Router 7 (SPA, all routing client-side; Vercel rewrites non-asset paths to `index.html`).
- Context providers for cross-cutting concerns: Language, Theme, Auth, User data, Scroll.
- Pages are lazy-loaded (`React.lazy`) with per-vendor manual chunks.
- framer-motion for page/element animation; three.js scenes lazily mounted and pausable.

**Database architecture:** PostgreSQL (Supabase), `public` schema, camelCase quoted columns matching the JS field names exactly (so PostgREST JSON keys map 1:1). RLS is the security boundary. JSONB columns hold per-student lists (`favorites.ids`, `ratings.ratings`, `user_stats.viewed`) — a document-in-relational pattern that keeps per-student reads single-row.

**Authentication architecture:** custom student accounts (studentId or email + password). Passwords are hashed client-side (PBKDF2 via Web Crypto, salted) and the **hash** is sent to the server; login compares hashes inside a SECURITY DEFINER RPC. Supabase GoTrue (`auth.users`) is linked for OAuth providers (Google/GitHub/Microsoft/LinkedIn) and email-reset flows; a row in `public.users` is the source of truth for role/profile. Session persistence uses supabase-js storage + a mirrored `sessionStorage` identity for instant boot.

**External services:** Supabase (DB/Auth/Storage), YouTube (video embeds + thumbnails via `img.youtube.com`), api.ipify.org (client IP for last-visit logging).

**Data flow (macro)**

```text
Browser (React SPA, Vercel CDN + Service Worker cache)
  │  HTTPS (supabase-js v2)
  ▼
Supabase PostgREST  ── RLS policies + SECURITY DEFINER RPCs (PostgreSQL)
  │                        │
  │                        ├─ public.users / lectures / sources / ... (tables)
  │                        └─ request_throttle (rate limiting)
  ▼
Rows / JSONB  ──►  services layer (src/services)  ──►  hooks (useLectures, UserDataContext)
  │                                                        │
  ▼                                                        ▼
Storage (sources bucket, public read)          Contexts (Auth / UserData) ──► UI render
```

From click to screen, concretely (opening the Lectures page):

1. Router matches `/lectures`; `ProtectedRoute` checks `AuthContext` (session restored from supabase-js + cached identity validated via `get_session_profile` RPC).
2. `useLectures(user)` fires `getLectures()` → `GET /rest/v1/lectures` (RLS-scoped) — module-cached 60 s.
3. Simultaneously `UserDataContext` loads that student's favorites/ratings/viewed (own-row RLS or RPC).
4. Filter/sort run **client-side** (`useMemo` in the hook); the grid renders memoized `LectureCard`s with `LectureThumbnail` (quality ladder) and `StarRating`.
5. Every mutation (favorite/rate/watch) optimistically updates local state, then persists via RPC and reconciles with the server response.

---

## 3. Technology Stack

Everything below is declared in `package.json` and actually imported by the code. No speculative entries.

### Runtime dependencies

| Technology | Version | Purpose | Where used | Why it matters |
|---|---|---|---|---|
| React | ^18.3.1 | UI framework | everywhere | Component model, Context, Suspense/lazy |
| React DOM | ^18.3.1 | DOM renderer | `src/main.jsx` | |
| react-router-dom | ^7.18.2 | Client routing | `src/main.jsx`, `src/App.jsx`, all pages | SPA routes, protected routes, URL-synced filters |
| @supabase/supabase-js | ^2.112.3 | DB/Auth/Storage client | `src/services/supabase.js` → all services | The only network layer of the app |
| framer-motion | ^10.16.0 | Animation | pages, modals, `src/utils/motionTokens.js` | Page transitions, reveals, springs; `useReducedMotion` respected |
| @react-three/fiber | ^8.18.0 | React renderer for three.js | `src/components/three/*` | 3D hero/roadmap scenes |
| @react-three/drei | ^9.122.0 | three.js helpers | same | Orbit-ish helpers, geometry/materials |
| three | ^0.180.0 | WebGL engine | same | The actual 3D |
| react-hot-toast | ^2.4.1 | Toasts | global `<Toaster>` in `src/App.jsx` | Theme-aware notifications |
| react-icons | ^4.10.1 | Icon set (Fi/Si/Fa) | every component | Zero-config icons, own vendor chunk |

### Dev dependencies

| Technology | Version | Purpose |
|---|---|---|
| Vite | ^7.3.6 | Build tool + dev server; esbuild minify; manual chunk splitting |
| @vitejs/plugin-react | ^4.3.1 | React Fast Refresh / JSX transform |
| Tailwind CSS | ^3.4.1 | Utility CSS (with logical `ms-/me-/ps-/pe-` used for RTL) |
| PostCSS / autoprefixer | ^8.4.40 / ^10.4.19 | Tailwind pipeline |
| ESLint (+ react, react-hooks plugins, prettier config) | ^8.56.0 | Lint gate (`--ext .js,.jsx` is required — plain `eslint src` checks no `.jsx` files) |
| Prettier | ^3.2.1 | Formatting |
| Vitest | ^3.2.6 | Unit test runner (jsdom) |
| @vitest/coverage-v8, @vitest/ui | ^3.2.6 | Coverage gate (thresholds in `vitest.config.js`) |
| @testing-library/react / user-event / jest-dom | ^16 / ^14.5 / ^6.4 | Unit test utilities |
| @playwright/test | ^1.62.1 | E2E (chromium desktop + Pixel 7 project) |
| @axe-core/playwright | ^4.13.0 | Accessibility scans in E2E |
| jsdom | ^23.0.0 | DOM for unit tests |
| satori + sharp | ^0.33.4 / ^0.35.4 | OG-image generation script |
| Node engines | >=20.19 / >=22.12 | Required runtime |

### Runtime services

| Service | Role |
|---|---|
| Supabase (project `wtetgxgtvqewveorfnwj`) | PostgreSQL + PostgREST, GoTrue auth, Storage (`sources` bucket) |
| Vercel | Hosting, headers/rewrites, deploy script |
| YouTube | Video playback (nocookie embeds) + thumbnails (`img.youtube.com`) |
| api.ipify.org | Public IP lookup at login (for `lastIP` audit field) |

---

## 4. Folder & File Structure

```text
al-azher-it-hub/
├── index.html                 # HTML shell: SEO meta, OG, JSON-LD, fonts preload, boot.js, CSP is header-side
├── package.json               # deps, scripts, engines
├── vite.config.js             # build, manualChunks (vendor split), __BUILD_DATE__ injection for sw.js
├── vitest.config.js           # jsdom env, setup, coverage thresholds (17/30/33/17)
├── playwright.config.js       # chromium + mobile-chromium projects, preview server on :4173
├── vercel.json                # SPA rewrites, immutable asset caching, security headers + CSP
├── lighthouserc.json          # Lighthouse CI budgets (perf/a11y/SEO, script+font size caps)
├── .env / .env.example        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (never commit .env)
├── .github/workflows/ci.yml   # lint → unit → coverage → build → E2E (2 projects) → Lighthouse → npm audit
│
├── public/                    # served as-is
│   ├── sw.js / sw-register.js # Service Worker: shell precache + runtime cache (bounded) + thumbnail cache rules
│   ├── boot.js                # pre-React: language/dir detection + English font preload
│   ├── manifest.json          # PWA manifest
│   ├── fonts/                 # self-hosted Cairo (400/700/800, arabic+latin subsets) + Inter (400/700)
│   ├── og-image.png, favicon.svg, icon-192/512.png, apple-touch-icon.png
│   ├── robots.txt             # disallows auth-walled routes; sitemap pointer
│   └── sitemap.xml            # 10 public URLs
│
├── scripts/                   # node utilities (no runtime role)
│   ├── deploy-prebuilt.cjs    # deploys dist/ to Vercel via REST (token arg)
│   ├── download-fonts.cjs     # re-downloads the self-hosted font subsets
│   ├── generate-og.cjs        # satori+sharp → og-image.png
│   ├── generate-sitemap.cjs   # regenerates sitemap.xml
│   └── (utility scripts referenced in package.json)
│
├── supabase/                  # SQL migrations — applied manually by the owner in Supabase SQL Editor
│   ├── schema.sql             # base tables (users, courses, lectures, sources, additions, ...)
│   ├── auth-migration.sql     # get_current_student_id(), is_current_user_admin(), auth linking, student_touch_visit
│   ├── security-consolidated.sql  # consolidated RLS + SECURITY DEFINER RPCs
│   ├── migration-security-hardening.sql # IDOR fixes, throttle_request(), register/login/reset RPCs, add_student_log, storage allowlist
│   ├── migration-fix-live-rls.sql       # URGENT: RLS for activity + student_logs (see §15)
│   └── ... (notifications-rls, atomic-user-data, db-password-reset, p1/p2 perf, etc.)
│
├── docs/                      # AUDIT_REPORT.md, SECURITY_MIGRATION_CHECKLIST.md, DEPLOY_AND_MIGRATE_GUIDE_AR.md, auth-migration.md
│
├── e2e/                       # Playwright specs
│   ├── smoke.spec.js          # public shell, SEO assets, 404, locale detection
│   ├── auth.spec.js           # invalid login inline error, protected-route gating, signup mismatch
│   ├── interactions.spec.js   # language toggle persistence, theme toggle, FAQ accordion
│   └── a11y.spec.js           # axe-core scans on /, /login, /signup, 404 (critical+serious = fail)
│
└── src/
    ├── main.jsx               # entry: providers stacked (BrowserRouter → Language → Theme → Auth → UserData → Scroll) + SplashScreen
    ├── App.jsx                # lazy route table, layout (Navbar/Footer/BackToTop/GlobalSearch/Chatbot/Toaster), Ctrl+K handler
    ├── index.css              # Tailwind + design tokens (CSS vars for light/dark/amoled), spatial utilities, card-shine, etc.
    ├── i18n/ar.json, en.json  # 1,010 keys each; nested namespaces + inline.* section; parity must be maintained
    ├── data/quotes.js         # motivational quotes (ar/en) for Profile
    ├── context/               # AuthContext, LanguageContext, ThemeContext, UserDataContext
    ├── hooks/                 # useLectures, useUserData-adjacent, useSeo, useScrollManager, useFocusTrap, useScrollLock,
    │                          # usePagination, useTilt3D, useMagnetic, useParallax, useCountUp, useFileUpload, useNotifications
    ├── services/              # THE ONLY layer that talks to Supabase (see §11)
    ├── utils/                 # helpers (lectureThumb, extractYouTubeId, downloadFile...), crypto (PBKDF2),
    │                          # motionTokens, sanitize, sort, courseStats, adminShared, chatIntents
    ├── test-utils/            # renderWithProviders, fluent Supabase mock (mockSupabase.js), setup.js
    ├── pages/                 # 15 route pages + WelcomeGate (see §5)
    └── components/
        ├── AdminDashboard/    # OverviewPanel, UsersTable, LecturesTable, SourcesTable, CoursesTable,
        │                      # SettingsPanel, ActivityLogs, StudentLogs, AdminSearch, Pagination, modals, CrudForm
        ├── auth/              # AuthLayout, AuthAlert, AuthLogo, AuthSubmitButton, AuthSuccessAnimation, SocialAuth
        ├── feedback/          # ErrorState
        ├── shared/            # LectureThumbnail, VideoPlayer, Modal-adjacent (ConfirmDialog), Skeleton, EmptyState,
        │                      # CustomSelect, StarRating, PageHero, Reveal, CountUp, SectionHeading, SiteLogo, Badge,
        │                      # TypewriterText
        ├── spatial/           # SpatialBackground (aurora/orbs/grid), SpatialInput
        ├── three/             # Lazy3DScene + ParticlesScene / KnowledgeScene / CubesScene / RoadmapScene (pausable)
        ├── ui/                # Button, Card, Badge, Modal, PageHeader, Spinner (primitive kit, index.js barrel)
        ├── Navbar.jsx, Footer.jsx, BackToTop.jsx, GlobalSearch.jsx, GlobalSearchTrigger.jsx,
        ├── Chatbot.jsx, WelcomeModal.jsx, SplashScreen.jsx, ErrorBoundary.jsx, ProtectedRoute.jsx, HeroSection.jsx
        └── __tests__/         # unit tests colocated per folder
```

**Key files — responsibility & relationships**

| File | Responsibility | Logic or UI? |
|---|---|---|
| `src/services/supabase.js` | Creates the single supabase-js client from env vars; exports `getSupabase()` and `authRpc()`. **Throws deliberately** if env vars are missing. | Pure logic; everything DB-related depends on it |
| `src/services/createCrudService.js` | Generic CRUD factory (getAll/add/update/remove) with a 60 s in-memory cache, in-flight dedupe, and invalidation epochs. lectures/sources/additions/courses are built from it. | Core logic |
| `src/context/AuthContext.jsx` | Session restore (supabase session + cached identity via `get_session_profile`), login/register/reset wrappers, login throttling (client-side mirror of the server policy), `isAdmin`, sign-out. Reads/writes `al_azher_session` sessionStorage. | Heavy logic |
| `src/context/UserDataContext.jsx` | Per-student favorites/ratings/viewed with optimistic updates, 60 s cache + stale TTL, inflight dedupe. Consumed by Home/Lectures/LectureDetail/Profile. | Heavy logic |
| `src/context/LanguageContext.jsx` | `lang`, `toggleLang`, `t(key, params)` with interpolation; async-loads `en.json` (ar bundled); sets `<html lang/dir>`. | Logic |
| `src/context/ThemeContext.jsx` | light/dark/amoled cycle, persists manual choice, follows OS preference until touched, sets `.dark`/`data-theme` + `color-scheme`. | Logic |
| `src/hooks/useLectures.js` | Lectures page brain: fetch, subject derivation, filter/sort/watch-filter `useMemo`s, favorites/ratings/watch handlers (delegating to UserDataContext). | Core logic |
| `src/hooks/useScrollManager.jsx` | `ScrollProvider` (only `scrolled` boolean in context) + `useScrollFrame()` — rAF-coalesced scroll listener for direct-DOM writes (progress bars). | Performance logic |
| `src/components/three/Lazy3DScene.jsx` | Loads a three.js scene only near viewport (IO 200px), pauses it off-screen (`paused` → `frameloop="never"`), capability-gated (WebGL, memory, reduced-motion, coarse pointer) with CSS fallback. | Logic + render |
| `public/sw.js` | Shell precache (`Promise.allSettled`), bounded runtime cache (400), cache-first thumbnails that **refuse ≤2.5 KB placeholder responses**, navigation-preload. `__BUILD_DATE__` cache-name busts per build. | Infra logic |
| `supabase/schema.sql` (+ siblings) | The full DB contract (§9). Applied manually in Supabase SQL Editor. | Schema |

---

## 5. Pages & Routes

All routes are defined in `src/App.jsx` (lazy). `PageTransition` wraps every page; `ProtectedRoute` gates student content; `adminOnly` gates the dashboard.

| Route | Page (`src/pages/`) | Purpose | Auth | Notes |
|---|---|---|---|---|
| `/` | `WelcomeGate.jsx` | Landing/gate for anonymous visitors: hero with 3D cluster, features, testimonials, FAQ, CTAs | Public | Redirects signed-in users to `/home` |
| `/login` | `Login.jsx` | studentId/email + password login; OAuth (SocialAuth); forgot link | Public | Updates `lastVisit` via `student_touch_visit` + ipify; logs LOGIN |
| `/signup` | `Signup.jsx` | Registration (name, studentId, email, major, password + live strength meter) | Public | `register_user` RPC (server-derived identity) |
| `/forgot-password` | `ForgotPassword.jsx` | Supabase `resetPasswordForEmail` → email link | Public | Non-enumerating |
| `/reset-password` | `ResetPassword.jsx` | Set new password from email link | Public (recovery token) | `reset_password` RPC |
| `/home` | `Home.jsx` | Student home: welcome, stats, continue-watching, subject progress, additions preview | **Protected** | |
| `/lectures` | `Lectures.jsx` | Full catalog: FilterBar (subject chips + debounced search + CustomSelect sort), grid/list toggle, pagination (24/page), continue-watching strip, VideoPlayerModal | **Protected** | URL-synced filters (`?subject=&q=&sort=&view=&watch=`) |
| `/lecture/:id` | `LectureDetail.jsx` | Single lecture: facade player → inline embed, subject-sources section, related lectures, favorites, rating, reading-progress bar | **Protected** | Marks viewed |
| `/sources` | `Sources.jsx` | Source files by subject; admin upload modal (multi-file, magic-byte validation, progress); per-file and "download all" | **Protected** | Upload = admin-only UI + RLS |
| `/study-plan` | `StudyPlan.jsx` | Admin-managed study plan (per-semester rows) | **Protected** | |
| `/roadmap` | `CourseRoadmap.jsx` | Course roadmap with 3D scene | **Protected** | |
| `/additions` | `Additions.jsx` | Posts/announcements + per-item comments | **Protected** | Comments RPC-enforced (name matching) |
| `/contact` | `Contact.jsx` | Contact info, WhatsApp deep-link, social links, mailto form with success celebration | **Protected** | |
| `/profile` | `Profile.jsx` | Profile view/edit (URL-scheme-validated socials), password change, stats, 12-week activity heatmap | **Protected** | |
| `/admin` | `AdminDashboard.jsx` → `AdminDashboardContent.jsx` | Admin panel: overview stats, users/lectures/sources/courses CRUD tables, settings panel (study plan/roadmap/additions editing), activity + student logs, export/import | **Protected + adminOnly** | |
| `*` | `NotFound.jsx` | 404 page | Public | |
| Legacy redirects | `/videos` → `/lectures`, `/books`, `/courses`, `/schedule`, `/university` → `/home` | Compatibility | — | `<Navigate replace>` |

**Navigation model:** the Navbar (hidden on `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password` — see `hideLayout` in `App.jsx`) carries all main routes + search trigger + theme/language toggles + user menu (logout with ConfirmDialog, notifications popover via `useNotifications`). BackToTop with a scroll-progress ring floats on all authed pages. WelcomeModal greets returning logged-in users.

---

## 6. Components Architecture

The most important components (name · location · responsibility · props · state · dependencies · parents · children · reusable?):

| Component | Location | Responsibility | Key props | Key state | Depends on | Parents | Children | Reusable |
|---|---|---|---|---|---|---|---|---|
| `App` | `src/App.jsx` | Route table, layout shell, GlobalSearch activation (Ctrl+K), chatbot idle-defer, Toaster | — | `chatbotReady`, `searchActive/AutoOpen` | all contexts | `main.jsx` | Navbar, Footer, routes, GlobalSearch/Trigger, Chatbot, WelcomeModal, Toaster | — |
| `ProtectedRoute` | `components/ProtectedRoute.jsx` | Loading spinner while auth resolves; `Navigate to /` if no user; `adminOnly` → `/home` if not admin | `children`, `adminOnly` | — | AuthContext | App | page | ✔ |
| `Navbar` | `components/Navbar.jsx` | Sticky nav: routes, search trigger, theme/lang toggles, notifications popover (focus-trapped), mobile drawer, logout confirm; scroll progress bar via `useScrollFrame` | — | `isOpen`, `showNotifications`, `showLogoutConfirm` | Auth, Language, Theme, useNotifications, useFocusTrap×2 | App | many primitives | — |
| `HeroSection` | `components/HeroSection.jsx` | Home hero: gradient title, counters (CountUp), magnetic CTAs, parallax 3D layer | `ctaLink`, counts… | — | useParallax, useMagnetic, Lazy3DScene | Home | CountUp, MagneticLink, Lazy3DScene | ✔ |
| `WelcomeGate` | `pages/WelcomeGate.jsx` | Anonymous landing (hero + in-view-gated animations + FAQ + testimonials + final CTA) | — | FAQ items | useInView gates, Lazy3DScene, MagneticLink | App (route `/`) | many | — |
| `LectureCard` / `LectureListItem` | `pages/Lectures.jsx` (memo) | Grid/list lecture card: thumbnail ladder, tilt+shine+spotlight hover, favorite/rate/play | lecture, callbacks | local hover | LectureThumbnail, StarRating, useTilt3D | Lectures grid | — | page-local |
| `LectureThumbnail` | `components/shared/LectureThumbnail.jsx` | YouTube thumb with quality ladder (maxres→hq→mq→gradient) + placeholder detection (`naturalWidth<200` ⇒ fail), ladder resets on `videoId` change | `videoId`, `sizes`, `priority`, `className` | `step` | `utils/helpers.lectureThumb` | Lectures, Home, GlobalSearch | — | ✔✔ |
| `VideoPlayer` | `components/shared/VideoPlayer.jsx` | Facade thumbnail → click → `youtube-nocookie` iframe (autoplay); external link fallback; embed-failure UI; fires `onWatch` once | `videoId`, `url`, `title`, `autoPlay` | `inline`, `loading`, `embedFailed` | `helpers.lectureThumb` | LectureDetail, VideoPlayerModal | — | ✔ |
| `Modal` | `components/ui/Modal.jsx` | Accessible dialog: focus trap, scroll lock, overlay click close, size classes | `isOpen`, `onClose`, `title`, `size`, `labelledBy` | — | useFocusTrap, useScrollLock | ConfirmDialog, VideoPlayerModal, UploadModal… | — | ✔✔ |
| `ConfirmDialog` | `components/shared/ConfirmDialog.jsx` | Dangerous-action confirm; stays open on rejection (retry) | `isOpen`, `onConfirm`, `onClose`, `variant` | `pending` | Modal | Navbar logout, admin deletes | — | ✔ |
| `GlobalSearch` | `components/GlobalSearch.jsx` | Ctrl+K search over lectures/sources/additions/pages; combobox + listbox keyboard nav; navigates on select | `autoOpen` | `open`, `query`, `results`, `activeIndex` | services, useFocusTrap | App (lazy, mounted while active) | — | — |
| `Chatbot` | `components/Chatbot.jsx` | Rule-based assistant: intents from live data (subjects/lectures/contacts), quick replies, copy buttons, localStorage history | — | messages, input, typing | `utils/chatIntents`, UserDataContext | App (idle-deferred, lazy) | — | — |
| `Lazy3DScene` | `components/three/Lazy3DScene.jsx` | Capability-gated lazy WebGL host with pause-off-screen; CSS fallback | `scene`, `fallback`, `sceneProps` | `near`, `visible`, `SceneComp` | IntersectionObserver ×2 | Hero, WelcomeGate, Roadmap | the 4 scenes | ✔ |
| `AdminDashboardContent` | `components/AdminDashboard/` | Tabbed admin surface wiring tables + panels + modals | — | tab state | many admin services | AdminDashboard page | tables, panels, modals | — |
| `FilterBar` | `components/FilterBar.jsx` | Debounced search + subject chips (aria-pressed) + reset | subjects, activeSubject, callbacks | `localSearch` | LanguageContext | Lectures, Sources | — | ✔ |
| `ErrorState` / `EmptyState` / `Skeleton` | `components/feedback`, `components/shared` | Standard failure / empty / loading visuals | `error`, `onRetry`… | — | — | all pages | — | ✔✔ |
| `Reveal`, `CountUp`, `SectionHeading`, `PageHero`, `SiteLogo`, `StarRating`, `CustomSelect` | `components/shared` | Small shared building blocks (in-view reveals, animated counters, page headers, accessible select) | see files | minimal | framer-motion, useCountUp | most pages | — | ✔✔ |
| `SpatialBackground` / `SpatialInput` | `components/spatial` | Ambient aurora/orbs/grid background; themed input with icon/validation slots | — | — | CSS tokens | layout + forms | — | ✔ |
| `ErrorBoundary` | `components/ErrorBoundary.jsx` | Root class boundary: bilingual fallback + reload; logs to console | `lang`, `children` | `hasError` | — | App (nested), page-level | — | ✔ |

Reusable primitives also live in `components/ui/` (Button, Card, Badge, PageHeader, Spinner) exported via `index.js` — newer code should prefer `shared/` + `ui/` over page-local copies.

---

## 7. UI/UX Structure

- **Layout:** `App.jsx` renders `SpatialBackground` (aurora + orbs + grid, fixed behind content) → skip-link → `Navbar` → `main#main-content` (routes with `AnimatePresence mode="sync"` page transitions) → `Footer` → `BackToTop` → overlays (GlobalSearch, Chatbot FAB, WelcomeModal, Toaster at `top-center`). Auth pages (`/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`) hide the chrome via `hideLayout`.
- **Design system:** Tailwind + CSS-variable tokens in `index.css` (`--bg-surface`, `--text-primary`, `--border-default`, …) driving semantic classes: `glass`, `glass-panel`, `btn-spatial`/`btn-primary`/`btn-secondary`, `stat-tile`, `border-line`, `input-spatial`, `gradient-text-spatial`, `card-shine`, `tilt-card`, `page-hero`. Light/dark/AMOLED switch purely by flipping the CSS variables under `.dark` / `[data-theme="amoled"]`.
- **Forms:** `SpatialInput` (icon slot, password reveal, validation state) inside `AuthLayout`-framed auth pages; labels are properly associated (`htmlFor`/sr-only), errors use `aria-invalid` + `aria-describedby` (`#auth-form-alert`). Login/Signup include a live password-strength meter (Signup) and client-side lockout mirroring the server policy.
- **Cards:** lectures grid/list with spotlight-follow, 3D tilt (`useTilt3D`), shine sweep, thumbnail ladder; stat tiles (`stat-tile`); source cards with file chips.
- **Modals:** one accessible base (`ui/Modal` — focus trap, scroll lock, `aria-modal`), used for video playback, confirm dialogs, uploads, admin profile modals.
- **Search & filters:** Ctrl+K global overlay (combobox pattern, arrows/enter/escape); page-level `FilterBar` (debounced search, subject chips, custom accessible select), URL-synced on Lectures.
- **Responsive:** mobile-first Tailwind; nav collapses to a focus-trapped drawer; grids collapse 3→2→1; touch targets ≥ 40–44px; mobile E2E project (Pixel 7) guards the smoke path.
- **Dark/Light (+ AMOLED):** toggle cycles; manual choice persisted (`al_azher_theme`), OS-preference followed until the user overrides; `meta[name=theme-color]` synced.
- **RTL/LTR:** Arabic default. Logical properties (`ms-/me-/ps-/pe-/start-/end-`) throughout; `dir` set pre-React in `boot.js` and kept in sync by LanguageContext; icons mirrored contextually (`rotate-180`).
- **Accessibility:** skip-link, landmarks/aria-labels on nav & search, focus traps in modals/drawers, `aria-expanded/pressed` on toggles, keyboard-complete CustomSelect, reduced-motion honored (`useReducedMotion` gates every animation, infinite loops pause off-screen), axe scans fail CI on critical/serious violations.
- **Notifications:** unread count badge + popover (own-row `notifications` table via `useNotifications`).

---

## 8. State Management

| Kind | Where | What lives there | Consumers |
|---|---|---|---|
| **Global context** | `AuthContext` | `user` (identity+role), `isAdmin`, `loading`, login/register/reset/signOut, client throttle state | ProtectedRoute, Navbar, all pages, services that need identity |
| | `LanguageContext` | `lang`, `t()` | everything user-visible |
| | `ThemeContext` | `theme`, `dark`, `toggle` | Toaster, theme toggle, CSS side effects |
| | `UserDataContext` | `favorites`, `ratings`, `viewed` + optimistic mutators | Home, Lectures, LectureDetail, Profile, Chatbot |
| | `ScrollProvider` | `scrolled` boolean only (continuous values deliberately NOT in context — see `useScrollFrame`) | Navbar, BackToTop |
| **Server state** | `createCrudService` module cache (60 s) + `UserDataContext` cache/inflight | lectures/sources/additions/courses; favorites/ratings/viewed | pages via hooks |
| **URL state** | `useSearchParams` | Lectures filters (`subject`, `q`, `sort`, `view`, `watch`) | Lectures ↔ browser history (shareable) |
| **Local UI state** | `useState` per component | modals open/close, tab index, search drafts, FAQ accordions, chat window… | local |
| **Form state** | local `useState` objects | auth forms, profile edit, admin CrudForm, upload queue (`useFileUpload`: files, progress, validation) | forms |
| **DOM-direct state** | refs + CSS vars | scroll progress bars, tilt/spotlight/magnetic transforms, reading-progress — written via rAF, never through React state (re-render avoidance) | Navbar, BackToTop, LectureDetail, cards |
| **Persistent client state** | `sessionStorage` (`al_azher_lang`, `al_azher_theme`, `al_azher_session`), `localStorage` (supabase auth token, chat history) | preferences + identity mirror | boot.js, contexts, Chatbot |
| **URL path** | React Router | deep links (`/lecture/:id`), legacy redirects | — |

---

## 9. Database Structure

**Provider:** Supabase PostgreSQL (`public` schema, PostgREST). Column names are quoted camelCase to match JS objects exactly. **Applied manually** by the owner from `supabase/*.sql` (idempotent, ordered — see `docs/SECURITY_MIGRATION_CHECKLIST.md`).

### Tables (`supabase/schema.sql`)

| Table | Fields (type) | Notes / relationships |
|---|---|---|
| `users` | `studentId` (PK text), `name`, `email`, `major`, `role` ('student'/'admin'), `status`, `password` (**`salt:hash`** string), `createdAt`, `lastVisit`, `lastIP`, `lastDevice`, `google`, `linkedin`, `whatsapp` | Source of truth for identity/role. Linked to GoTrue via `authUserId`-style linkage RPCs (`link_auth_user`) |
| `courses` | `id` (PK), `nameAr/En`, `doctorAr/En`, `lectures` (jsonb), `sources` (jsonb), `createdAt` | Legacy/aggregate container |
| `lectures` | `id` (PK), `courseId`, `titleAr/En`, `url` (YouTube), `date`, `subjectAr/En`, `videoId`, `createdAt` | `videoId` optional — otherwise extracted from `url` |
| `sources` | `id` (PK), `titleAr/En`, `url`, `subjectAr/En`, `fileData` (legacy single URL), `fileName`, `filePath`, `files` (jsonb array of {url,name,size,mimeType,path,uploadedAt}), `date`, `createdAt` | Files live in Storage `sources` bucket (public read) |
| `additions` | `id` (PK), `type` ('post'), `subjectAr/En`, `titleAr/En`, `descriptionAr/En`, `url`, `createdAt` | Posts/announcements |
| `subjects` | `id` (PK), `ar`, `en`, `doctorAr/En`, `createdAt` | Subject dictionary |
| `comments` | `id` (PK), `additionId` → additions, `userId`, `userName`, `text`, `createdAt` | Index: `comments_addition_idx` |
| `activity` | `id` (PK), `type`, `action`, `detail`, `studentId`, `name`, `ip`, `device`, `timestamp` | Audit trail (admin actions/registers). **RLS: admin-only read, auth insert — after `migration-fix-live-rls.sql`** |
| `student_logs` | same shape as `activity` | Per-student activity log. Indexes: `student_logs_student_idx`, `student_logs_timestamp_idx`. Same RLS as activity **+ `logs_own_read`** (a student may read own rows) |
| `favorites` | `studentId` (PK), `ids` (jsonb array of lecture ids) | One row per student |
| `ratings` | `studentId` (PK), `ratings` (jsonb map lectureId→1..5) | One row per student |
| `user_stats` | `studentId` (PK), `viewed` (jsonb array of lecture ids), `lastVisit` | Watch tracking |
| `settings` | `key` (PK), `value` (jsonb) | Key-value platform settings |
| `request_throttle` (hardening) | `action`, `key`, `count`, `window_start`… | Rate-limit ledger; **no policies, revoked** — reachable only inside SECURITY DEFINER functions |
| `password_attempts` (throttle patch) | per-identity login attempt ledger | Same pattern for login |
| `notifications` | per-user notifications | Own-row RLS (`migration-notifications-rls.sql`), fed by `get_notifications_feed` |

### Security rules (RLS + RPCs)

- Every table above has RLS **enabled**; policies follow: content tables = admin write / authed read; per-student tables = own-row only; `activity`/`student_logs` = admin read, authed insert, **own-log read** (after the live-rls fix — see §15 for the live caveat).
- Security-critical logic is exposed **only** through `SECURITY DEFINER` functions (the app never writes privileged rows directly):
  - `register_user`, `get_login_profile(_by_email)`, `get_password_salt_by_email`, `user_exists`, `verify_student_email`, `reset_password`, `link_auth_user`, `get_session_profile`, `get_profile_by_auth_id/email`, `student_update_profile`, `admin_manage_user`
  - `toggle_favorite`, `set_rating`, `mark_viewed` (owner resolved server-side from the JWT — IDOR fix)
  - `add_student_log` (identity derived server-side), `student_touch_visit`
  - `throttle_request` / `clear_request_throttle` (generic server-side rate limiting used by all anon-reachable RPCs)
  - `get_comments_public` (public comment reads without raw userId), `get_notifications_feed`
- Storage: bucket `sources` — public read (education content), **no** anon write/delete; upload extension + content-type allowlist enforced server-side by the hardening migration.

### CRUD / query patterns

- Reads: `select *` with `order("createdAt", desc)` + `limit` (200) via `createCrudService` (client-side cache 60 s).
- Per-student reads: single-row PK lookups (`favorites`, `ratings`, `user_stats`).
- Writes: RPCs above for anything touching identity/privilege; plain table updates only for admin CRUD (RLS enforces admin).
- Admin export: `dataExport.js` reads all tables sequentially for the backup JSON.

---

## 10. Authentication & Authorization

**Registration** (`Signup.jsx` → `users.registerUser`)
1. Client validates (studentId format, email, password ≥ 8 with complexity, confirm match).
2. PBKDF2 hash (Web Crypto, per-user salt from `utils/crypto.generateSalt`) — the **hash** travels, never the password.
3. `register_user` RPC creates `auth.users` entry (email+generated password for GoTrue linkage) and the `public.users` row with `salt:hash`. Duplicate studentId/email → friendly errors.

**Login** (`Login.jsx` → `users.authenticateUser`)
1. Fetch salt via `get_password_salt_by_email` / login profile via `get_login_profile(_by_email)` — both throttled server-side (`throttle_request`), both hash-compare inside SECURITY DEFINER so a wrong hash simply returns no row (no oracle).
2. On success: GoTrue session (linked account) + `public.users` profile cached; `updateLastVisit` (`student_touch_visit`, IP via ipify + UA) and a LOGIN student-log entry fire (fail-soft).
3. Client-side lockout mirrors the server's 10 attempts / 15 min policy (unit-tested).

**Session handling**
- supabase-js persists the GoTrue session (localStorage) and auto-refreshes.
- `AuthContext` mirrors the profile in `sessionStorage` (`al_azher_session`) for instant boot, then revalidates via `get_session_profile` (server-derived identity).
- `onAuthStateChange` clears the identity **only on `SIGNED_OUT`** — deliberately not on `INITIAL_SESSION` (a null-session boot event that previously raced the restore and signed users out — fixed).
- Known quirk: an OAuth session without a matching `users` row is reconciled by `findOrCreateOAuthUser` (random internal password hash).

**Authorization / roles**
- `role` in `public.users` ('student' | 'admin'); `is_current_user_admin()` is the SQL-side check used by every admin policy/RPC.
- Client mirrors it as `isAdmin` for UI only — **all enforcement is SQL-side**.
- Protected routes: student content requires a user; `/admin` requires `adminOnly` (client gate) + RLS (real gate).

**Logout** — `users.signOut()` → GoTrue sign-out + sessionStorage clear.

**Reset chain** — email → `resetPasswordForEmail` (redirect `/reset-password`) → `reset_password` RPC enforces real-email ownership + minimum hash length + throttling.

**Weaknesses / caveats (verified, see also §15)**
- 🔴 Live DB: `activity` + `student_logs` anon-readable until `migration-fix-live-rls.sql` is applied by the owner (PII: names, studentIds, IPs, devices).
- 🟠 Live DB lacks the hardening RPCs (`mark_viewed`, `add_student_log`, `student_update_profile`, throttled login chain) → those features degrade and older client-side-only throttling is what's active.
- 🟡 Password hashing is client-side (PBKDF2). Not a direct leak (only hashes travel), but rate-limiting and comparison live in unusual places; signup with **no email confirmation** allows mass fake accounts (dashboard toggle recommended).
- 🟡 `sources` bucket is public-read by design — acceptable for educational content, but anything sensitive must never be uploaded there.

---

## 11. API & External Services

There is no custom REST server; "API" = Supabase PostgREST/Storage/GoTrue + a few public endpoints.

| Service | Purpose | Connection | Auth | Data sent | Data received | Used in |
|---|---|---|---|---|---|---|
| **Supabase PostgREST** `/rest/v1/*` | All CRUD | `supabase-js` client (`VITE_SUPABASE_URL`) | `apikey` + Bearer JWT; SQL RLS/SECURITY DEFINER decide | table filters, jsonb rows, RPC params | rows / jsonb / RPC results | `src/services/*` only |
| **Supabase GoTrue** `/auth/v1/*` | OAuth sessions, password reset, token refresh | supabase-js `auth` | JWT | credentials, reset emails | session/JWT | `AuthContext`, `users.js`, `SocialAuth` |
| **Supabase Storage** `/storage/v1/*` | Source file hosting (`sources` bucket) | supabase-js `storage` | public read; authenticated write | uploaded files | public URLs | `sourceStorage.js`, `Sources.jsx` |
| **YouTube embeds** | Lecture playback | `youtube-nocookie.com/embed` iframe (`frame-src` allows it) | none | videoId | player | `VideoPlayer` |
| **img.youtube.com** | Thumbnails | `<img>` + SW cache rules | none | — | JPEG ladder | `LectureThumbnail` |
| **api.ipify.org** | Client public IP at login | `fetch('https://api.ipify.org?format=json')` | none | — | `{ip}` | `Login.jsx` (fail-soft) |
| **Vercel** | Hosting/CDN/headers | deploy script (`scripts/deploy-prebuilt.cjs`) | deploy token (owner-side only) | dist/ | deployment | CI/release |

RPC inventory (SQL-side "API"): see §9 — every RPC is a PostgREST `POST /rest/v1/rpc/<fn>` with RLS-granted `execute` rights (anon where safe, authenticated otherwise, throttled where sensitive).

---

## 12. Core Features

1. **Lecture browsing & filters** — `Lectures.jsx` + `useLectures`: subject chips, debounced search, sort, view-mode, watched-filter; URL-synced; pagination 24/batch. Depends on `lectures` + `UserDataContext`.
2. **Inline playback** — `VideoPlayer` facade → `youtube-nocookie` iframe on click (one `onWatch` mark); external fallback; embed-blocked UI. Depends on `videoId`/`url`.
3. **Watch tracking / continue-watching** — `mark_viewed` RPC (owner derived server-side) → `user_stats.viewed`; Home + Lectures show resume strips with progress.
4. **Favorites & ratings** — optimistic `UserDataContext` mutators → `toggle_favorite` / `set_rating` RPCs (IDOR-hardened). StarRating component everywhere consistent.
5. **Sources library + uploads** — admin multi-file upload (size/MIME/magic-byte validation, progress via `useFileUpload`) → Storage → `sources.files` jsonb; students browse/download (`downloadFile` blob-download with anchor fallback); "download all".
6. **Study plan / roadmap** — admin-edited JSON (`SettingsPanel`) rendered on student pages (roadmap with lazy 3D scene).
7. **Additions + comments** — posts feed; `get_comments_public` RPC (display-name only + isMine), insert policy enforces name match (anti-spoofing).
8. **Global search (Ctrl+K)** — lazy GlobalSearch over lectures/sources/additions/pages; keyboard-complete combobox; navigates to `/lecture/:id` directly.
9. **Chatbot** — offline rule-based intents (`chatIntents.js` over live subjects/lectures + contact info), quick replies, localStorage history; no external AI.
10. **Admin dashboard** — overview stats (`adminStats`), Users/Lectures/Sources/Courses tables (search + pagination), SettingsPanel (plan/roadmap/additions), Activity + Student logs viewers, JSON export/import backup.
11. **Profile** — edit name/major/socials (URL schemes validated client **and** server via `safe_social_url`), password change (`reset_password` chain), stats, **12-week activity heatmap** (from own `student_logs` — relies on the `logs_own_read` policy after the live-rls fix).
12. **Bilingual + themes** — everything above, in ar/en × light/dark/amoled, RTL/LTR correct.
13. **3D visual system** — 4 pausable three.js scenes, capability-gated, never blocking content.

---

## 13. Data Flow

**Watch a lecture (mark viewed)**

```text
User clicks play (VideoPlayer facade)
↓
VideoPlayer.beginInline() → onWatch() (once per lecture, ref-guarded)
↓
LectureDetail handler → UserDataContext.markViewed(lectureId)
↓
optimistic: setViewed([...viewed, id]) + cache patch
↓
services/userStats.markViewed → POST /rest/v1/rpc/mark_viewed
↓
PostgreSQL: SECURITY DEFINER resolves owner from JWT → upsert user_stats.viewed
↓
server response reconciles optimistic state (or leaves it on transient error)
↓
UI: progress bars / continue-watching update everywhere (context consumers)
```

**Filter the lectures list**

```text
User types in FilterBar
↓
localSearch state (300ms debounce) → onSearchChange
↓
Lectures state (also URL ?q= via setSearchParams)
↓
useLectures.useMemo: filter+sort over cached lectures array
↓
re-render memoized LectureCard grid (no new network call)
```

**Admin uploads a source**

```text
Admin picks files (UploadModal)
↓
useFileUpload: validate size + MIME + magic bytes
↓
uploadSourceFile: Storage upload → getPublicUrl → file object
↓
services/sources.addSource → INSERT row (RLS: admin-only)
↓
invalidate lectures/sources cache epoch → refetch
↓
students see the new source on next load (60s cache or reload)
```

**Login**

```text
User submits credentials
↓
client throttle check (10/15min mirror)
↓
hash password (PBKDF2+salt) → get_login_profile RPC (hash compared server-side)
↓
GoTrue session + users profile → AuthContext.setUser
↓
sessionStorage mirror + student_touch_visit + LOGIN log (fail-soft)
↓
Navigate to /home or /admin (ProtectedRoute passes)
```

---

## 14. Performance Analysis

**Bundles (measured, production build)**

- Entry `js/index-*.js` ≈ 160 KB; vendor split: `vendor-three` 827 KB (lazy — only fetched when a 3D scene nears viewport), `vendor-supabase` 211 KB, `vendor-react` 176 KB, `AdminDashboard` 115 KB (admin-only), `vendor-motion` 106 KB, `vendor-icons` 33 KB, page chunks 27–30 KB. Total JS ≈ 1.9 MB across 53 files, most loaded on demand.
- `manualChunks` in `vite.config.js` keeps react-icons/toast/supabase/three out of the core; immutable cache headers make every hashed asset a one-time download.

**Rendering**

- All routes `React.lazy` + Suspense (`PageLoader`); admin dashboard never loads for students.
- Lecture grids are `memo` + pagination (24/batch) + `usePagination`; hover effects (spotlight/tilt/magnetic/progress) write CSS vars via rAF — zero re-renders per mouse move.
- Scroll context holds a boolean; continuous scroll values go through `useScrollFrame` rAF listeners writing the DOM directly.
- 3D scenes: IntersectionObserver-gated load AND pause (`frameloop="never"` off-screen), capability-gated (memory/coarse-pointer/reduced-motion), unified low-power GL settings.
- framer-motion loops (badges, marquee, orbit) pause when out of view (`useInView`).

**Caching**

- `createCrudService`: 60 s module cache + in-flight dedupe + invalidation epochs.
- `UserDataContext`: cached per-student data with stale TTL + optimistic writes.
- Service Worker: shell precache (fonts included), bounded runtime cache (400 entries), cache-first YouTube thumbnails with placeholder rejection (≤2.5 KB never cached → self-healing), navigation-preload; immutable hashed assets; `sw.js`/`index.html` always revalidated.
- Fonts: self-hosted woff2 subsets, `font-display` swap, English-only font preloaded only when English detected (`boot.js`).

**Images** — responsive `srcSet`/`sizes` on thumbnails; lazy loading + `decoding=async` by default; first-paint thumbnails `eager` + `fetchpriority=high`.

**API calls** — debounced search (no per-keystroke queries), URL-synced filters computed client-side, single parallel data load per page (`Promise.all`), toasts/error boundaries for resilience.

**Loading states** — Skeletons on every page + `PageLoader` for chunk transitions; `ErrorState` with retry on failure.

**Known perf considerations**

- `vendor-three` is big but strictly lazy; users who never scroll near a scene never download it.
- The 60 s caches are in-memory only (per reload) — deliberate; SW handles cross-visit caching.
- Lighthouse CI budgets guard the floor (perf ≥ 0.7 warn, a11y/SEO ≥ 0.9 error, script ≤ 600 KB/run, LCP ≤ 3.5 s, CLS ≤ 0.1).

---

## 15. Security Analysis

Verified against the code and — where noted — against the **live database** (probed 2026-09-04 with the anonymous key, i.e., attacker-perspective).

### 🔴 Critical

1. **Live PII leak — `student_logs` + `activity` readable by anonymous callers** (confirmed live: 297 + 182 rows; students' names, studentIds, **IP addresses**, device/user-agent strings). Root cause: those two tables' RLS is not effective on the live DB (a dashboard-created "read for all" policy pattern). The fix exists — `supabase/migration-fix-live-rls.sql` (restored to the repo in commit `13e6b94`, now with an added `logs_own_read` policy for the profile heatmap) — **but the owner has not applied it yet**. Action: run it in the Supabase SQL Editor (steps in `docs/SECURITY_MIGRATION_CHECKLIST.md`). Until then, treat these rows as public.
2. **Hardening migration not applied live** — the RPCs `mark_viewed`, `add_student_log`, `student_update_profile`, and the throttled login chain (`get_login_profile*`, `throttle_request`, `register_user`, `reset_password` hardened versions) return 404 on the live DB. Consequences: no server-side rate limiting yet, IDOR-hardened RPCs inactive. Fix: apply `supabase/migration-security-hardening.sql` (and `security-consolidated.sql` first if the helpers are missing).

### 🟠 High

3. **Signup without email confirmation** (live GoTrue returns a session immediately) — enables mass fake accounts. Mitigation: enable "Confirm email" in Supabase Auth settings and adapt the signup flow.
4. **Client-side password hashing** — PBKDF2 runs in the browser; only `salt:hash` is stored/sent. Not directly exploitable, but the scheme's strength depends on the hash-compare RPCs being deployed (they are part of the pending migration).

### 🟡 Medium

5. **Public storage bucket** (`sources`) — by design for course files; the risk is operator error (uploading something sensitive). Server-side extension/content-type allowlist (hardening migration) blocks html/svg/script uploads once applied.
6. **Session mirror in `sessionStorage`** (`al_azher_session`) — convenience cache; it is revalidated server-side on boot and stripped of admin role on network failure, but a local attacker on the machine could read/modify it.
7. **Chatbot history in `localStorage`** — non-sensitive conversation text; fine, but noteworthy.

### 🟢 Low / managed

- CSP is strict (`script-src 'self'`, no inline scripts; frame-src limited to YouTube; connect-src limited to Supabase/ipify) + `X-Frame-Options: DENY`, HSTS, `nosniff`, Referrer/Permissions-Policy — via `vercel.json`.
- The Supabase **anon key is public by design**; no service-role key exists anywhere in the repo (verified by grep).
- All admin writes are RLS-enforced in SQL, not just hidden UI; client `isAdmin` is cosmetic.
- `.env*` files are git-ignored and excluded from deploy uploads; secret scans run before push; `npm audit --audit-level=moderate` in CI.
- Client-side URL scheme validation (`safe_social_url`, `safe_whatsapp`) mirrors server-side SQL validation (defense in depth).

---

## 16. SEO & Accessibility

**SEO**

- `index.html`: bilingual title/description, canonical, `og:*` (type/url/title/description/image 1200×630 + alt), `twitter:card`, `theme-color`, JSON-LD (`EducationalOrganization` + `WebSite` with SearchAction).
- Per-route SEO via `useSeo(path, lang)` — title/description/canonical per page, `og:image`/`twitter:image` injected, `noindex, nofollow` on `/admin`.
- `public/sitemap.xml` — 10 public URLs (/, /home, /lectures, /sources, /study-plan, /roadmap, /additions, /contact, /login, /signup) with `lastmod`; regenerated by `scripts/generate-sitemap.cjs`.
- `public/robots.txt` — allows public pages, disallows auth-walled routes (they redirect for crawlers anyway — avoids soft-duplicates) + sitemap pointer.
- SPA caveats handled: Vercel rewrite returns `index.html` for non-asset paths; hashed immutable assets; content is client-rendered (crawlers that execute JS see it; the meta layer carries the essentials).

**Accessibility**

- Landmarks + skip-link (`#main-content`), labeled navigation, `aria-current` nav state.
- Forms: associated labels (visible or sr-only), `aria-invalid` + `aria-describedby` error wiring, live-region alerts.
- Dialogs/drawers: `role=dialog`, `aria-modal`, focus trap (`useFocusTrap`), ESC handling, body scroll lock (stacked-safe `useScrollLock`).
- Widgets: keyboard-complete `CustomSelect` (listbox pattern), combobox GlobalSearch, `aria-pressed` filter chips, `aria-expanded` accordions, `StarRating` with accessible labels.
- Motion: every animation gated by `useReducedMotion`; infinite loops pause off-screen or in background.
- Contrast: dark-mode text bumped to `white/60+` tiers; verified by axe scans.
- CI enforcement: `e2e/a11y.spec.js` runs axe-core (wcag2a/aa, 21aa) on `/`, `/login`, `/signup`, 404 — critical/serious violations fail the build. One real violation (unlabeled OAuth SVG icons) was found and fixed by these scans.

---

## 17. Testing

| Suite | Tool | Count | Location | Notes |
|---|---|---|---|---|
| Unit | Vitest + Testing Library + jsdom | **214 tests / 33 files** | `src/**/__tests__/` | Central fluent Supabase mock (`test-utils/mockSupabase.js`), `renderWithProviders` (Language→Theme→Scroll→Auth→Router). Coverage thresholds: 17% stmts / 30% branch / 33% funcs / 17% lines (`vitest.config.js`) |
| E2E | Playwright (chromium) | 16 specs | `e2e/` | Runs against `npm run preview` (production build); locale pinned `ar`; traces on retry |
| E2E mobile | Playwright (Pixel 7 project) | 12 specs | same | Smoke + interactions on mobile viewport |
| A11y | @axe-core/playwright | 4 scans | `e2e/a11y.spec.js` | critical/serious = failure |
| Perf budget | Lighthouse CI | 1 URL | `lighthouserc.json` | a11y/SEO/headers as errors, perf warn-level |

Run: `npm test` (watch) · `npm run test:coverage` · `npm run test:e2e` (builds first: `npm run build && npx playwright test`).

Conventions: explicit imports (no Vitest globals), `cleanup()` after each test, mock Supabase installed per test via `vi.mock('@/services/supabase')` in `test-utils/setup.js`.

---

## 18. Deployment & Environment

**Environment variables** (`.env`, mirrored in Vercel project settings):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
```

**Local dev:** `npm install` → `npm run dev` (port 3000) → `npm run lint:check` → `npm test`.

**Production:** `npm run build` → `dist/` (entry in `js/`, chunks in `assets/`).

**Deploy options**
1. Git push → Vercel Git integration (standard path).
2. `node scripts/deploy-prebuilt.cjs <token> <scope-id> al-azher-it-hub` — REST-based prebuilt deploy used by the owner (token never committed).

**Vercel config** (`vercel.json`): SPA rewrite `"/((?!js/|assets/).*)" → /index.html`; immutable caching for hashed assets/fonts/images; `must-revalidate` for `sw.js`/`index.html`; full security-header set + CSP (see §15).

**Database changes:** always via `supabase/*.sql` applied manually in the Supabase SQL Editor, in the documented order; files are idempotent. The checklist with verification queries lives in `docs/SECURITY_MIGRATION_CHECKLIST.md`.

**CI** (`.github/workflows/ci.yml`, node 22): lint → unit → coverage gate → build → E2E (both projects) → Lighthouse budgets → `npm audit`.

---

## 19. Developer Guide: How to Extend

**Add a page**
1. Create `src/pages/MyPage.jsx` (follow `Contact.jsx` structure: `pageContainer/pageItem` motion variants, `PageHero`, ErrorState handling).
2. Register the lazy route in `src/App.jsx` (`PageTransition` wrapper; `ProtectedRoute` if it needs auth) and add it to `useSeo`'s route table if it's public.
3. Add nav link in `Navbar.jsx`, sitemap entry (if public) + regenerate, and i18n keys.

**Add translations** — never inline `isArabic ? '…' : '…'` in new code; add matching keys to **both** `src/i18n/ar.json` and `en.json` (namespaces per page; the `inline.*` section holds the migrated legacy strings) and use `t('ns.key')`. Parity is expected — a missing key renders the dotted path and warns in dev.

**Add a DB table/feature**
1. Model it in a new idempotent `supabase/migration-*.sql` (RLS enabled from day one; policies: admin write / authed read / own-row where personal).
2. If it involves identity or privilege, write a `SECURITY DEFINER` RPC that derives the owner from the JWT (`get_current_student_id()`), grant `execute` narrowly, and throttle if anon-reachable.
3. Wrap it in `src/services/` (never call `getSupabase().from()` outside services) and export through `services/index.js`.

**Add a component** — prefer `components/shared/` (app-specific) or `components/ui/` (primitives); page-specific stays in the page file. Respect the conventions: `prefersReduced` gating for animation, logical spacing utilities for RTL, accessible names on interactive elements.

**Performance rules of thumb** — heavy vendor → its own manual chunk + lazy; effects writing visuals → rAF + CSS vars, not state; lists → memo + pagination; anything infinite → pause off-screen.

**Release checklist** — `npm run lint:check` → `npm test` → `npm run build` → `npx playwright test` → secret scan → formal concise English commit → push → deploy → verify live (routes 200 `text/html`, sitemap, title).

---

*End of document. Maintained alongside the code; update it when the architecture changes.*
