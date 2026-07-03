# Architecture

## Current State

NoProblemo uses a minimal Next.js App Router architecture with locale-prefixed routing:

- `app/[locale]/` contains the locale root layout, public home page, support page, auth placeholders, and guest solve workspace.
- `app/[locale]/solve/_components/guest-workspace.tsx` is the browser-only guest workspace that uses localStorage.
- `app/globals.css` contains global styles imported by the locale layout.
- `i18n/` contains shared `next-intl` routing, navigation, and request configuration.
- `messages/` contains one JSON message catalog per supported locale.
- `proxy.ts` redirects unprefixed routes and negotiates locale prefixes.
- `public/` contains static assets from the initial scaffold.
- `supabase/` contains Supabase project configuration and seed placeholder files.
- `docs/` contains project operating notes for Codex and future maintainers.

## Runtime

- Frontend: Next.js 16 App Router with React 19.
- Styling: Tailwind CSS 4 through PostCSS.
- Language: TypeScript with strict checking enabled.
- Internationalization: `next-intl` with locale-prefixed routes.
- Deployment: Vercel production deployment.
- Backend: Supabase is configured externally, but application integration is deferred.

## Phase 3 Design Choice

The app remains frontend-only in Phase 3. There are no route handlers, server actions, database calls, authentication flows, background jobs, or third-party service calls.

The root path `/` is handled by `next-intl` middleware and redirects to a locale route. Invalid locale segments return not found. Arabic and Urdu set `dir="rtl"` on the document; all other locales set `dir="ltr"`.

Guest workspace data is stored only in browser localStorage. Login and signup routes are placeholders that explain future auth behavior without implementing authentication.

## Future Structure

When later phases begin, prefer small, explicit folders such as:

- `app/(marketing)/` for public informational routes.
- `app/(app)/` for authenticated product routes.
- `app/_components/` for colocated route-specific components.
- `lib/` for shared server-safe utilities.
- `supabase/migrations/` only when database schema work is in scope.

Do not add those folders until they are needed.
