# Architecture

## Current Technical Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `next-intl` for locale routing and UI messages
- Supabase folder present for future auth/database/RLS work
- Vercel production deployment
- Domeneshop planned mainly for domain and DNS

## Current Folder Structure

- `app/[locale]/layout.tsx`: locale root layout, metadata, `lang`, `dir`, and `NextIntlClientProvider`.
- `app/[locale]/page.tsx`: localized public landing page.
- `app/[locale]/solve/page.tsx`: localized guest solve page shell.
- `app/[locale]/solve/_components/guest-workspace.tsx`: client component for localStorage guest drafts, Markdown copy/export, and login prompts.
- `app/[locale]/support/page.tsx`: support/contact page.
- `app/[locale]/login/page.tsx`: placeholder login page; no authentication implemented.
- `app/[locale]/signup/page.tsx`: placeholder signup page; no account creation implemented.
- `app/[locale]/_components/language-switcher.tsx`: locale switcher.
- `app/[locale]/_components/site-footer.tsx`: shared footer with support email.
- `app/globals.css`: global Tailwind CSS.
- `i18n/`: `next-intl` routing, navigation, and request configuration.
- `messages/`: UI message catalogs for all supported locales.
- `proxy.ts`: locale negotiation and redirects for unprefixed routes.
- `supabase/`: Supabase CLI configuration and seed file; no migrations.
- `docs/`: Codex logs, handoff prompts, and project map.

No `components/` or `lib/` directory currently exists. Add them only when shared components or utilities are actually needed.

## Main Routes

- `/` redirects to a detected locale or `en`.
- `/[locale]` landing page.
- `/[locale]/solve` guest problem-solving workspace.
- `/[locale]/support` support/contact page.
- `/[locale]/login` auth placeholder.
- `/[locale]/signup` account placeholder.

Supported locales are `en`, `zh-CN`, `hi`, `es`, `ar`, `fr`, `bn`, `pt-BR`, `id`, `ur`, and `nb`. Arabic and Urdu use `dir="rtl"`.

## Expected Frontend Structure

Keep App Router pages route-focused. Use colocated `_components` folders for route-specific UI. Add shared top-level `components/` only when a component is reused across multiple route groups. Add `lib/` only for shared utilities such as Supabase clients, validation helpers, and typed data access.

## Expected Backend/Supabase Structure

Future Supabase work should be deliberate:

- Define schema in `DATABASE_SCHEMA.md` first.
- Add migrations under `supabase/migrations/` only when explicitly scoped.
- Add typed client helpers only after environment variables and auth model are confirmed.
- Enforce row-level security from the first migration.

## Authentication Flow Direction

Authentication is planned, not implemented. Expected future flow:

1. User signs up or logs in through Supabase Auth.
2. App creates or reads a `profiles` row linked to `auth.users`.
3. Authenticated users can save challenges to Supabase.
4. Guest localStorage drafts can optionally be copied into a saved challenge after login, if explicitly implemented.
5. Groups, invites, messaging, and dashboard access require authenticated users.

## Data Flow

Current data flow:

- UI messages load from `messages/*.json`.
- Guest workspace state is stored in browser localStorage under `noproblemo.guestWorkspace.v1`.
- No guest data is sent to Supabase.
- No server actions, route handlers, or database queries exist.

Planned data flow:

- Authenticated UI reads/writes through Supabase with RLS.
- Challenge access depends on ownership or accepted group membership.
- Private messages and challenge content are never public.

## Deployment Direction

Deploy on Vercel. Configure production environment variables in Vercel, never in git. Domeneshop should be used for domain/DNS pointing to Vercel when the domain is ready.

## What Should Stay Simple During MVP

- No AI until the core challenge workflow is stable.
- No payments until value and account model are clear.
- No complex real-time collaboration before basic saved challenges and permissions exist.
- No broad design system before recurring UI patterns emerge.
- No database shortcuts that bypass RLS.
