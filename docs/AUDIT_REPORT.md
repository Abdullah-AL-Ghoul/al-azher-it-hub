# AL-Azher IT Hub — Professional Audit Report

**Audit date:** 2026-08-27
**Audited commit/state:** working tree on `master` (uncommitted modifications vs `f2f4a3b` noted where relevant)
**Stack:** React 18 + Vite 7 + Tailwind 3 + framer-motion · Supabase (Postgres + Auth + Storage) · Vercel · PWA service worker · Vitest + GitHub Actions
**Method:** three parallel deep audits (frontend/UX, backend/security/infra, SEO/perf/quality) over the full `src/`, `supabase/`, `public/`, config, and `dist/` bundle, with the highest-severity findings re-verified directly against source.

> **Implementation status (same day):** the P0–P4 roadmap in §9 has been implemented in
> this working tree — see the commit accompanying this report. DB-layer fixes are
> delivered as `supabase/migration-security-hardening.sql` + `supabase/migration-public-catalog.sql`
> with `docs/SECURITY_MIGRATION_CHECKLIST.md`; **you apply the SQL to the live project,
> then deploy the client in the same release.**

---

## 1. Executive Summary

AL-Azher IT Hub is a bilingual (Arabic/English, RTL-first) IT education platform for Al-Azhar students. The codebase shows unusually high craftsmanship for its size: a semantic three-theme design token system, exemplary reduced-motion support, correct logical-property RTL handling, a well-built lazy-routing/perf architecture, and disciplined cleanup of past audit findings (service-worker caching, font weight reduction, chatbot deferral, storage magic-byte validation).

The serious problems are concentrated in two areas:

1. **Security (score 55/100).** There is a **confirmed live IDOR**: `toggle_favorite`, `set_rating`, and `mark_viewed` are `SECURITY DEFINER` functions granted to `anon` that trust a client-supplied `p_student_id` with no ownership check. The password-reset chain uses knowledge-based "ownership proof" with no out-of-band verification. Nearly all rate limiting is client-side (sessionStorage) and trivially bypassed. Several mitigations exist **only** in `security-consolidated.sql`, and because the ~14 SQL migrations are applied manually by hand (no CLI migration history, no `config.toml`), the live database state is unverifiable from the repo — a process risk that must be closed regardless of code fixes.

2. **SEO (score 32/100).** 100% of course content is behind `ProtectedRoute` and rendered client-side, so every content URL serves the same landing DOM to crawlers — the courses are unindexable. The OG image is an SVG (rejected by all major social scrapers), hreflang ar/en point to the *same* URL, and metadata/structured data are injected client-side only, with just one static JSON-LD block.

Architecture and UX are strong but carry structural debt: a complete `ui/` component kit exists but is **dead code** (every page re-implements buttons/badges/skeletons), two competing data layers can drift, ~400+ UI strings bypass the `t()` i18n dictionary, and `Chatbot.jsx` is a 1,068-line monolith. Testing is effectively absent (5% line coverage) and the configured coverage thresholds are dead config.

The roadmap in §9 fixes security first (P0), then architecture/UX and performance (P1), then SEO growth (P1/P2), then testing/CI (P2/P3). Database-layer fixes are delivered as a consolidated, reviewable SQL migration to be applied by the owner to production.

## 2. Current Project Score

| Dimension | Score /100 | Weight | Weighted |
|---|---|---|---|
| Architecture | 74 | 15% | 11.1 |
| UI/UX | 82 | 15% | 12.3 |
| Performance | 66 | 15% | 9.9 |
| Security | 55 | 20% | 11.0 |
| SEO & Growth | 32 | 10% | 3.2 |
| Code Quality | 72 | 10% | 7.2 |
| Testing & CI | 48 | 10% | 4.8 |
| DevOps & Infra | 76 | 5% | 3.8 |
| **Overall** | | | **63.3 / 100** |

## 3. Architecture Review

**What is strong**
- All 18 routes `React.lazy`-loaded under a single `Suspense` (`src/App.jsx:19-36`); chatbot chunk deferred via `requestIdleCallback` (`App.jsx:82-93`).
- `AuthContext` session restore handles async with a mounted-flag, subscribes to `onAuthStateChange` with cleanup, and memoizes its value (`AuthContext.jsx:105-118, 240-248`).
- `UserDataContext` stale-while-revalidate pattern with TTL is well executed.
- `ProtectedRoute` correctly waits for loading to avoid redirect flash.
- Manual chunking in `vite.config.js`, esbuild minify, no sourcemaps in prod.

**Problems (by severity)**
- **High — Two parallel data layers for the same user data.** `UserDataContext` (SWR-cached favorites/ratings/viewed) vs `useLectures` (independent local fetches) can drift across pages until reload. A favorite added on Home is not reflected on Lectures.
- **High — `ui/` component kit is dead code.** `Button/Card/Spinner/PageHeader/Badge` + barrel were built to solve the duplication problems and then never imported (only `ui/Modal` is used). This is the largest architecture debt.
- **Medium — `UserDataContext` stale rollback.** `toggleFavorite`/`setRating` capture `prev` from the render closure; two rapid toggles can roll back to a stale snapshot on failure.
- **Medium — No scroll restoration** (manual `window.scrollTo(0)` on every route change defeats browser history restoration).
- **Medium — Module-level caches never evict** (`UserDataContext` maps, `Navbar` prefetchCache).
- **Medium — `useNotifications` polls every 60 s unconditionally** (even when tab hidden, and for anonymous visitors).
- **Low — Storage keys are string literals scattered across the app** (no constants module).
- **Low — `Home.jsx:31` calls a hook inside `try/catch`** — masks provider misconfiguration.
- **Low — `ScrollProvider` re-renders consumers on every scroll frame** (new context object each update).

## 4. UI/UX Review

**What is at/above the Stripe/Apple bar**
- Semantic three-theme token system (light/dark/amoled) via CSS variables; coherent type scale; custom radius/shadow/easing tokens.
- Reduced-motion respected nearly everywhere (useReducedMotion + global CSS override) — best-in-class coverage.
- Logical-property RTL mirroring (`start/end`, `ms/me`, `ps/pe`).
- Skip link, focus traps, scroll lock, dialog semantics, optimistic UI with rollback.
- Skeleton/empty/error state coverage across 8+ pages.

**Gaps vs that bar**
- **High — Three button systems** (`.btn-primary`/`.btn-secondary`, `.btn-spatial`, unused `ui/Button`) and a 607-line `index.css` second design system that bypasses Tailwind; duplicated keyframes in both `tailwind.config.js` and `index.css`; duplicated palette (`royal`/`navy` vs `blue`/`slate`).
- **High — i18n adoption is partial.** 467/467 dictionary keys are perfectly parallel, but ~400+ UI strings use inline `isArabic ? '…' : '…'` ternaries (worst: `Chatbot.jsx` 111, `WelcomeGate.jsx` 73, `SettingsPanel.jsx` 65). `Modal` close `aria-label="Close"` is hardcoded English.
- **Medium — Motion over-applied.** Per-item mount/scroll animations on long lists (`Lectures.jsx:386,442`), unthrottled `mousemove` spotlight handlers (`Home.jsx:415,524`) — main scroll-jank source on mid-range phones.
- **Medium — Skeleton loaders hand-rolled per page** (no shared `<Skeleton>`); `Lectures.jsx:284-302` rebuilds `EmptyState` inline.
- **Medium — Sub-44 px touch targets** (`FilterBar` chips ~36 px, `CustomSelect` options ~37 px, footer quick links); no safe-area insets on fixed bottom controls (Chatbot FAB, BackToTop) despite `viewport-fit=cover`.
- **Medium — `ConfirmDialog` closes before the async action finishes** — no pending state on the confirm button; a failed delete leaves the dialog gone.
- **Low — `scrollbar-thin` referenced but never defined**; `Home.jsx` hooks in try/catch; `HeroSection` `studentsCount` prop actually receives "lectures this user watched".

## 5. Performance Report

Current bundle (`dist/`, built 2026-08-26):

| Item | Size |
|---|---|
| Critical-path JS (entry + 5 vendor chunks, modulepreloaded) | ~654 KB |
| CSS | ~96 KB |
| **Total pre-font** | **~750 KB** |

- **LCP:** ~750 KB critical JS/CSS + render-blocking Google Fonts → mobile LCP ~2.5-4 s (estimated). No real LCP image; hero is text/gradients.
- **TBT:** vendor parse + framer-motion + Supabase init + auth session restore ≈ 200-400 ms.
- **CLS:** low risk — images carry width/height, counters in fixed grids, `font-display=swap`. Good.
- **INP:** animations are transform/opacity based; heavy `blur()` orbs on WelcomeGate remain GPU cost on low-end mobile.

**Key findings**
- **High — framer-motion (100 KB chunk) and Supabase (212 KB) are statically/eagerly imported** on every first paint (`App.jsx:3`, `AuthContext.jsx:33`).
- **High — `vendor-icons` regressed 1.42 KB → 33.2 KB** (tree-shaking erosion from new icon imports); CSS grew 77 → 96 KB vs the Aug 21 audit.
- **High — Google Fonts still external + render-blocking** (no preload, no subsetting param).
- **Medium — Splash overlay blocks first paint 900 ms + 300 ms fade on first visit**; `ProtectedRoute` gates content on a network session-restore call on every protected page.
- **Medium — YouTube thumbs served as `mqdefault`/`hqdefault` JPEG only** — no `srcset`, no WebP, no `maxresdefault`; most have `loading="lazy"` + dimensions (CLS-safe).
- **Medium — Admin chunk is 112 KB lazy** (largest); N+1 comment-count queries (40 per Addition page).
- **Low — `select('*')` remains in `createCrudService`/`studentLogs`.**

## 6. Security Report

Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low

**🔴 C1 — IDOR in SECURITY DEFINER RPCs (confirmed live, highest priority)**
`supabase/migration-atomic-user-data.sql:11-91` — `toggle_favorite`, `set_rating`, `mark_viewed` are `SECURITY DEFINER`, take `p_student_id` from the caller with **no ownership check**, and are granted to `anon` + `authenticated`. Any caller (even logged-out) can overwrite any student's favorites/ratings/viewed history, and `mark_viewed` reveals what a victim has watched. No later migration redefines these functions, so the vulnerability is live. **Fix:** resolve owner server-side via `get_current_student_id()`; revoke `anon`.

**🟠 H1 — Password-reset chain is knowledge-based (state-dependent account takeover)**
`supabase/migration-db-password-reset.sql:16-33,35-79` accepts the synthetic email `studentId@al-azher.local` as ownership proof; `security-consolidated.sql:651-716` requires the real stored email. If consolidated is live, the synthetic-email path is closed, but the whole reset still never sends an out-of-band code — studentId + name + email is sufficient. Names are obtainable by any authenticated user via `comments.userName`/`userId`.

**🟠 H2/H3/H5 — No enforced server-side throttling; client limits bypassable**
Login path (`authenticateUser`, `src/services/users.js:328-392`) calls unthrottled `get_password_salt` + `get_login_profile`. `get_password_salt_by_email` is an unthrottled three-state oracle (account type + existence). `register_user` (anon) + `user_exists` (anon boolean oracle) enable enumeration and account flooding. All client limits live in memory/sessionStorage. The DB-side `password_attempts` pattern exists but is opt-in via a "REVIEW-ONLY" patch.

**🟠 H4 — Activity feed PII**
If `migration-notifications-rls.sql` was applied last, any authenticated user can read all `activity` rows incl. `studentId, name, ip, device`. Even the safe feed stores full names in `detail` (registered users' real names + studentIds).

**🟠 H6 — `link_auth_user` escalation (order-dependent)**
`security-fix.sql:78-98` lets an authenticated user claim any unclaimed `users` row (incl. an admin's) when the JWT lacks `studentId` metadata → admin takeover. `security-consolidated.sql:78-113` closes it (requires metadata match). Consolidated must be the live version.

**🟡 M1 — Legacy password scheme.** Unsalted SHA-256 for legacy accounts (trivially crackable on DB leak); client-side PBKDF2 (100k — below OWASP 600k+ guidance) with pass-the-hash properties (the digest is a replayable shared secret).

**🟡 M2 — Comments expose `userId` + `userName` to all authenticated users** — the PII source enabling H1's name-guessing step.

**🟡 M3 — Storage bucket public; no server-side content-type enforcement.** `text/plain`/`text/csv`/`application/json` bypass magic-byte checks; a mislabeled HTML/SVG upload would be publicly served from the CDN.

**🟡 M4 — Missing pagination** on `users` (limit 500), admin lists (5000), comments (100) — silent truncation.

**🟡 M5 — Client-only admin gating with stale-role fallback.** On network failure `AuthContext` trusts the cached sessionStorage role; a suspended/deleted admin keeps the admin UI until revalidation.

**🟡 M6 — Admin reset allows 6-char passwords** vs 8+ at signup. **M7 — `ResetPassword.jsx` skips legacy-hash sync when session lacks `studentId` metadata** (a reset that doesn't reset). **M8 — Social-URL sanitizers exist only in consolidated.** **M9 — `addStudentLog`/activity inserts accept arbitrary client fields** (forgeable audit trail).

**🔵 L1-L7 — Low.** Supabase URL baked into tracked files (harmless alone); `VERCEL_OIDC_TOKEN` in `.env.local` (untracked, hygiene — rotate if ever shared); **CSP regressed to `https://*.supabase.co` wildcard in the working tree** (HEAD pinned the specific host); SW caches all same-origin GETs (safe today); dev server CORS `*` + bind 0.0.0.0; `additions.url`/`sources.url` never scheme-validated.

**Checked out clean:** no `dangerouslySetInnerHTML`/raw innerHTML anywhere; comment text sanitized on insert + React-escaped on render; `users.password` revoked from anon/authenticated at column level; admin SECURITY DEFINER functions gate on `is_current_user_admin()` with allowlisted dynamic SQL (no SQLi); old `is_admin_key` backdoor dropped; no committed secrets in git history.

## 7. SEO Report

- **🔴 C1 — Content not indexable.** Every content route is wrapped in `ProtectedRoute` (`src/App.jsx:134-163`); crawlers receive the WelcomeGate DOM on all of `/home`, `/lectures`, `/sources`, `/roadmap`, `/additions`, `/study-plan` (soft duplicates, wasted crawl budget). The entire course catalog is invisible to search. **Decision:** a public `/catalog` page (this roadmap).
- **🔴 C2 — OG image is an SVG** (`public/og-image.svg`) — rejected by all major link previewers; missing `og:image:alt`.
- **🔴 C3 — Meta/canonical/hreflang/robots/JSON-LD injected client-side only** (`src/hooks/useSeo.js:127-163`); static head is identical per-route for non-JS crawlers.
- **🟠 H1 — hreflang ar/en point to the same URL** (no `/en` URL scheme exists) — contradictory annotation; English version uncrawlable.
- **🟠 H2 — Only one static `EducationalOrganization` JSON-LD**; no Course/FAQPage/WebSite+SearchAction/BreadcrumbList, no `sameAs`.
- **🟠 H3 — Sitemap issues:** hardcoded `lastmod` everywhere; hreflang alternates only on root; includes thin auth pages; `/reset-password` missing; no per-lecture URLs.
- **🟡 M1-M7 — robots.txt BOM + allows soft-duplicate routes; duplicate/conflicting `document.title` setters race with useSeo; preview-deploy canonicals hardcode prod origin; manifest lang fixed to `ar`; splash + auth gate delay first paint; lint config has no a11y rules.**

## 8. Code Quality Review

- **High — `ui/` kit dead** (see §3); duplicate `shared/Badge` vs `ui/Badge`.
- **High — `Chatbot.jsx` 1,068-line monolith** (20 intents inline).
- **High/Med — Verbatim duplication:** `downloadFile` (LectureDetail.jsx:15-43 vs Sources.jsx:49-77), `sourceFiles` vs `getAllFiles`, `uid()` generators (5 sites), `sortOptions` (2 sites), two count-up components, 5-star rating row (4 copies), upload-progress UI (2 copies).
- **Medium — `useFileUpload` no unmount guard; sequential uploads, no cancellation; 5 console.error/warn sites (one may log raw server errors); dead exports in `motionTokens.js`.**
- **Low — stray formatting `App.jsx:115`; misleading `studentsCount` prop; `.card` deprecated class unused; `line-clamp-*` re-implements Tailwind natives.**
- **Positives:** no TODO/FIXME leftovers; intervals/listeners cleaned up consistently; mounted-flag pattern applied throughout.

## 9. Improvement Roadmap (prioritized)

### Priority 0 — Critical (do immediately)
| # | Issue | Why it matters | Fix | Files | Difficulty |
|---|---|---|---|---|---|
| 1 | IDOR in atomic RPCs (C1) | Any user/anon can mutate any student's data | Server-side owner resolution + revoke anon | SQL migration | Easy |
| 2 | Reset chain + synthetic email (H1) | Account takeover | Strict real-email-only + throttle + out-of-band note | SQL + ForgotPassword.jsx | Easy |
| 3 | Server-side throttling default-on (H2/H3/H5) | Brute force/enumeration | Generalize `password_attempts` → `throttle_request` | SQL | Medium |
| 4 | `link_auth_user` escalation (H6) | Admin takeover | Pin hardened version | SQL | Easy |
| 5 | PII in activity/comments (H4/M2) | Phishing fuel | Safe feed policy + name-only comments RPC | SQL + services | Medium |
| 6 | Stale admin role restore (M5) | Suspended user keeps admin UI | Don't trust cached role on failure | AuthContext.jsx | Easy |
| 7 | CSP wildcard regression (L3) | Script injection surface | Pin exact Supabase host | vercel.json | Easy |

### Priority 1 — High impact
- Adopt `ui/` kit; shared `Skeleton`/`StarRating`; delete dead code (architecture).
- Consolidate `UserDataContext` + `useLectures` (correctness).
- i18n adoption of inline ternaries (consistency).
- Chatbot split (maintainability).
- Performance: self-host fonts, splash reduction, defer session restore, icon cleanup.
- SEO: public `/catalog` page, OG PNG, structured data, sitemap/robots, title-race fix, hreflang cleanup.

### Priority 2 — Quality
- UX polish batch (ConfirmDialog pending, safe-area insets, 44 px targets, scrollbar-thin, scroll restoration, notifications gating).
- Motion diet (list animations, spotlight throttling).
- YouTube thumb `srcset`; admin chunk split; comments-count aggregate; keyset pagination.
- Coverage to threshold + CI gates (test:coverage, prettier).

### Priority 3 — Advanced
- ESLint 9 + jsx-a11y + react-refresh; framer-motion 12 / Tailwind v4 evaluation; SW offline page + image runtime cache + per-user cache namespacing; e2e smoke (Playwright); vercel-optimize pass; migrate fully off the legacy password column (`docs/auth-migration.md`).

## 10. Implementation Priority List

1. `supabase/migration-security-hardening.sql` (P0 — all SQL findings in one idempotent file) + `docs/SECURITY_MIGRATION_CHECKLIST.md`
2. Client security fixes (AuthContext, ForgotPassword, ResetPassword, UsersTable, comments/studentLogs/activity services, vercel.json, vite.config.js)
3. `docs/AUDIT_REPORT.md` (this file)
4. P1 architecture/UX batch
5. P1/P2 performance batch
6. P1/P2 SEO batch (catalog page, OG, structured data, sitemap)
7. P2/P3 testing/CI/docs batch

## 11. Future Scaling Recommendations

1. **Migrate to a managed migration workflow** (Supabase CLI + `supabase/migrations/` with `config.toml`) so the live DB state is always reproducible from the repo — this closes the entire class of "state-dependent" security findings.
2. **Finish the auth migration** (drop the legacy `users.password` column + login RPCs; `docs/auth-migration.md`) — removes the pass-the-hash, oracle, and throttle surface at the root.
3. **Introduce URL-per-language** (`/en/…` or a secondary domain) when an English growth push happens; until then keep `lang`/`dir` only.
4. **Consider SSR/prerender (e.g., Vite SSG or a Vercel Edge function) for the public catalog + landing** to move metadata server-side.
5. **Add real email infrastructure** (Supabase Auth emails or Resend) for out-of-band password reset and notifications — removes the knowledge-based reset.
6. **E2E smoke tests** (Playwright) covering auth, catalog, and checkout-free flows before each deploy; enforce coverage gates in CI.
7. **Monitoring:** Vercel Analytics + Sentry (or similar) for real Core Web Vitals and error tracking before further perf work.

---

*Companion documents: `docs/SECURITY_MIGRATION_CHECKLIST.md` (P0 SQL apply + verification) · `supabase/migration-security-hardening.sql` (P0 SQL) · `PERFORMANCE_AUDIT.md` (prior perf audit) · `PRODUCT_DISCOVERY.md` (product/UX discovery).*
