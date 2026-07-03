# Architecture

## Current State

NoProblemo uses a minimal Next.js App Router architecture:

- `app/` contains the root layout, global styles, favicon, and public home page.
- `public/` contains static assets from the initial scaffold.
- `supabase/` contains Supabase project configuration and seed placeholder files.
- `docs/` contains project operating notes for Codex and future maintainers.

## Runtime

- Frontend: Next.js 16 App Router with React 19.
- Styling: Tailwind CSS 4 through PostCSS.
- Language: TypeScript with strict checking enabled.
- Deployment: Vercel production deployment.
- Backend: Supabase is configured externally, but application integration is deferred.

## Phase 1 Design Choice

The app stays mostly static in Phase 1. There are no route handlers, server actions, database calls, authentication flows, background jobs, or third-party service calls.

## Future Structure

When later phases begin, prefer small, explicit folders such as:

- `app/(marketing)/` for public informational routes.
- `app/(app)/` for authenticated product routes.
- `app/_components/` for colocated route-specific components.
- `lib/` for shared server-safe utilities.
- `supabase/migrations/` only when database schema work is in scope.

Do not add those folders until they are needed.
