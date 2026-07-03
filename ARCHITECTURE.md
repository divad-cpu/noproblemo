# Architecture

## Current Technical Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl` for locale routing and UI messages
- Supabase Auth/Postgres/RLS foundation
- Vercel production deployment
- Domeneshop planned mainly for domain and DNS

## Current Folder Structure

- `app/[locale]/layout.tsx`: locale root layout, metadata, `lang`, `dir`, and `NextIntlClientProvider`.
- `app/[locale]/page.tsx`: localized public landing page.
- `app/[locale]/solve/page.tsx`: localized guest solve page shell.
- `app/[locale]/solve/_components/guest-workspace.tsx`: client component for localStorage guest drafts, Markdown copy/export, and login prompts.
- `app/[locale]/support/page.tsx`: support/contact page.
- `app/[locale]/login/page.tsx`: placeholder login page; no real authentication UI yet.
- `app/[locale]/signup/page.tsx`: placeholder signup page; no real account creation UI yet.
- `app/[locale]/_components/language-switcher.tsx`: locale switcher.
- `app/[locale]/_components/site-footer.tsx`: shared footer with support email.
- `app/globals.css`: global Tailwind CSS.
- `i18n/`: `next-intl` routing, navigation, and request configuration.
- `messages/`: UI message catalogs for all supported locales.
- `proxy.ts`: locale negotiation and redirects for unprefixed routes.
- `lib/supabase/`: typed Supabase browser/server helper scaffolding and manual database types.
- `supabase/migrations/`: local SQL migrations.
- `supabase/config.toml`: Supabase CLI configuration.
- `docs/`: Codex logs, handoff prompts, and project map.

No shared top-level `components/` directory currently exists. Add it only when shared components are actually reused across route groups.

## Main Routes

- `/` redirects to a detected locale or `en`.
- `/[locale]` landing page.
- `/[locale]/solve` guest problem-solving workspace.
- `/[locale]/support` support/contact page.
- `/[locale]/login` auth placeholder.
- `/[locale]/signup` account placeholder.

Supported locales are `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, and `nb`. Arabic and Urdu use `dir="rtl"`.

## Frontend Structure

Keep App Router pages route-focused. Use colocated `_components` folders for route-specific UI. Add shared top-level `components/` only when a component is reused across multiple route groups. Add `lib/` only for shared utilities such as Supabase clients, validation helpers, and typed data access.

## Supabase Structure

Implemented in Phase 4:

- `supabase/migrations/20260703190000_phase4_supabase_foundation.sql`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/types.ts`

The migration creates:

- `profiles`
- `challenges`
- `challenge_sections`
- `challenge_solutions`
- `challenge_tasks`
- updated-at trigger function
- profile creation trigger for new `auth.users`
- owner-only RLS policies

The migration still needs to be applied and verified in Supabase.

## Authentication Flow Direction

Authentication is the next recommended phase, not implemented in Phase 4.

Expected Phase 5 flow:

1. User signs up or logs in through Supabase Auth.
2. Supabase database trigger creates a `profiles` row after auth user creation.
3. App reads the profile through RLS using the authenticated session.
4. Authenticated users can reach protected app layout/routes.
5. Dashboard and guest import remain Phase 6 unless explicitly scoped earlier.

## Data Flow

Current data flow:

- UI messages load from `messages/*.json`.
- Guest workspace state is stored in browser localStorage under `noproblemo.guestWorkspace.v1`.
- Guest data is not sent to Supabase.
- Supabase helpers exist but are not used by UI routes yet.
- No server actions, route handlers, or dashboard database queries exist.

Planned data flow:

- Phase 5: authentication session handling.
- Phase 6: authenticated dashboard and saved challenge reads/writes through Supabase RLS.
- Later: friends, groups, invites, and messaging policies.

## Deployment Direction

Deploy on Vercel. Configure production environment variables in Vercel, never in git. Domeneshop should be used for domain/DNS pointing to Vercel when the domain is ready.

## What Should Stay Simple During MVP

- No AI until the core challenge workflow is stable.
- No payments until value and account model are clear.
- No complex real-time collaboration before basic saved challenges and permissions exist.
- No broad design system before recurring UI patterns emerge.
- No database shortcuts that bypass RLS.
